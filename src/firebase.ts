import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  runTransaction, 
  collection, 
  query, 
  where, 
  limit, 
  getDocs,
  setDoc,
  serverTimestamp,
  getDoc
} from "firebase/firestore";

// These keys can be replaced with real configuration via .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB5-TApq_8CrrOEai32TeiWIW3iwETC1ss",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dotproject-ad06a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dotproject-ad06a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dotproject-ad06a.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "221994657450",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Check if we have valid Firebase keys. If any critical key is missing, fallback to mock mode.
const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== "YOUR_PROJECT_ID";

let app: any = null;
let auth: any = null;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase failed to initialize, falling back to mock mode:", error);
    app = null;
  }
}

// Define Type Interfaces for our App State
export type HabitCategory = "coding" | "fitness" | "writing" | "mindfulness";

export interface UserState {
  uid: string;
  status: "idle" | "matching" | "paired";
  currentPeerId: string | null;
  currentPairingId: string | null;
  habitCategory: HabitCategory | null;
  goalDescription: string | null;
  peerGoal: string | null;
  streakCount: number;
  displayName: string | null;
  photoURL: string | null;
}

export interface Note {
  id: string;
  pairingId: string;
  senderId: string;
  content: string;
  dateCode: string;
  createdAt: any;
}

// ==========================================
// 1. Live Firebase Implementation
// ==========================================

interface SignInResult {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

async function liveSignIn(): Promise<SignInResult> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  const cred = await signInWithPopup(auth, provider);
  return {
    uid: cred.user.uid,
    displayName: cred.user.displayName,
    photoURL: cred.user.photoURL
  };
}

function liveObserveUser(uid: string, callback: (user: UserState | null) => void): () => void {
  const userRef = doc(db, "users", uid);
  
  // Real-time listener for the user's document
  return onSnapshot(userRef, async (snapshot) => {
    if (!snapshot.exists()) {
      // If we authenticated but user doc doesn't exist yet, we'll write it on observe initial run
      // Grab credentials from currentUser if available
      const currentUser = auth?.currentUser;
      const initialUser: UserState = {
        uid,
        status: "idle",
        currentPeerId: null,
        currentPairingId: null,
        habitCategory: null,
        goalDescription: null,
        peerGoal: null,
        streakCount: 0,
        displayName: currentUser?.displayName || null,
        photoURL: currentUser?.photoURL || null
      };
      await setDoc(userRef, initialUser);
      callback(initialUser);
      return;
    }

    const userData = snapshot.data();
    const state: UserState = {
      uid,
      status: userData.status || "idle",
      currentPeerId: userData.currentPeerId || null,
      currentPairingId: userData.currentPairingId || null,
      habitCategory: userData.habitCategory || null,
      goalDescription: userData.goalDescription || null,
      peerGoal: null,
      streakCount: 0,
      displayName: userData.displayName || null,
      photoURL: userData.photoURL || null
    };

    // If paired, gather peer's goal and pairing streak
    if (state.status === "paired" && state.currentPeerId && state.currentPairingId) {
      try {
        const [peerSnap, pairingSnap] = await Promise.all([
          getDoc(doc(db, "users", state.currentPeerId)),
          getDoc(doc(db, "pairings", state.currentPairingId))
        ]);

        if (peerSnap.exists()) {
          state.peerGoal = peerSnap.data().goalDescription || null;
        }
        if (pairingSnap.exists()) {
          state.streakCount = pairingSnap.data().streakCount || 0;
        }
      } catch (err) {
        console.error("Error fetching peer/pairing details:", err);
      }
    }

    callback(state);
  }, (err) => {
    console.error("Observe user failed:", err);
  });
}

async function liveStartMatching(uid: string, category: HabitCategory, goal: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  
  await runTransaction(db, async (transaction) => {
    // 1. Join matching pool by writing goal and category
    transaction.update(userRef, {
      status: "matching",
      habitCategory: category,
      goalDescription: goal,
      joinedMatchingAt: serverTimestamp()
    });
    
    // 2. Query for another user in matching status with the SAME category
    const matchingQuery = query(
      collection(db, "users"),
      where("status", "==", "matching"),
      where("habitCategory", "==", category),
      where("uid", "!=", uid),
      limit(1)
    );
    
    const matchingSnap = await getDocs(matchingQuery);
    
    if (!matchingSnap.empty) {
      // Match found!
      const peerDoc = matchingSnap.docs[0];
      const peerId = peerDoc.id;
      const pairingRef = doc(collection(db, "pairings"));
      const pairingId = pairingRef.id;
      
      // Create pairing document
      transaction.set(pairingRef, {
        id: pairingId,
        users: [uid, peerId],
        habitCategory: category,
        active: true,
        streakCount: 0,
        lastActiveDateCode: null,
        createdAt: serverTimestamp()
      });
      
      // Update peer
      transaction.update(peerDoc.ref, {
        status: "paired",
        currentPeerId: uid,
        currentPairingId: pairingId
      });
      
      // Update self
      transaction.update(userRef, {
        status: "paired",
        currentPeerId: peerId,
        currentPairingId: pairingId
      });
    }
  });
}

async function liveCancelMatching(uid: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    status: "idle",
    currentPeerId: null,
    currentPairingId: null,
    habitCategory: null,
    goalDescription: null
  }, { merge: true });
}

async function liveDisconnectPairing(uid: string, pairingId: string, peerId: string | null): Promise<void> {
  const userRef = doc(db, "users", uid);
  
  await runTransaction(db, async (transaction) => {
    // Deactivate pairing
    const pairingRef = doc(db, "pairings", pairingId);
    transaction.update(pairingRef, {
      active: false,
      disconnectedAt: serverTimestamp()
    });
    
    // Set self back to idle
    transaction.update(userRef, {
      status: "idle",
      currentPeerId: null,
      currentPairingId: null,
      habitCategory: null,
      goalDescription: null
    });
    
    // Set peer back to idle
    if (peerId) {
      const peerRef = doc(db, "users", peerId);
      transaction.update(peerRef, {
        status: "idle",
        currentPeerId: null,
        currentPairingId: null,
        habitCategory: null,
        goalDescription: null
      });
    }
  });
}

async function liveSubmitDailyNote(pairingId: string, uid: string, content: string): Promise<void> {
  const dateCode = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const notesRef = collection(db, "notes");
  const userRef = doc(db, "users", uid);
  
  await runTransaction(db, async (transaction) => {
    // Write note
    const noteRef = doc(notesRef);
    transaction.set(noteRef, {
      pairingId,
      senderId: uid,
      content,
      dateCode,
      createdAt: serverTimestamp()
    });
    
    // Check if peer has already submitted today
    const userSnap = await transaction.get(userRef);
    const peerId = userSnap.data()?.currentPeerId;
    
    if (peerId) {
      const todayPeerNotesQuery = query(
        collection(db, "notes"),
        where("pairingId", "==", pairingId),
        where("senderId", "==", peerId),
        where("dateCode", "==", dateCode)
      );
      
      const peerNotesSnap = await getDocs(todayPeerNotesQuery);
      
      if (!peerNotesSnap.empty) {
        // Both checked in today! Update pairing streak
        const pairingRef = doc(db, "pairings", pairingId);
        const pairingSnap = await transaction.get(pairingRef);
        
        if (pairingSnap.exists()) {
          const lastActive = pairingSnap.data().lastActiveDateCode;
          let currentStreak = pairingSnap.data().streakCount || 0;
          
          const yesterday = new Date();
          yesterday.setUTCDate(yesterday.getUTCDate() - 1);
          const yesterdayCode = yesterday.toISOString().split("T")[0];
          
          if (lastActive === yesterdayCode) {
            currentStreak += 1;
          } else if (lastActive !== dateCode) {
            // Streak broken or brand new
            currentStreak = 1;
          }
          
          transaction.update(pairingRef, {
            streakCount: currentStreak,
            lastActiveDateCode: dateCode
          });
        }
      }
    }
  });
}

function liveObserveDailyNotes(pairingId: string, callback: (notes: Note[]) => void): () => void {
  const dateCode = new Date().toISOString().split("T")[0];
  const q = query(
    collection(db, "notes"),
    where("pairingId", "==", pairingId),
    where("dateCode", "==", dateCode)
  );
  
  return onSnapshot(q, (snapshot) => {
    const list: Note[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as Note);
    });
    callback(list);
  });
}

async function liveSignOut(): Promise<void> {
  if (auth) {
    await auth.signOut();
  }
}

async function liveGetUserNotesHistory(uid: string): Promise<Note[]> {
  const q = query(
    collection(db, "notes"),
    where("senderId", "==", uid)
  );
  const snap = await getDocs(q);
  const list: Note[] = [];
  snap.forEach((d) => {
    list.push({ id: d.id, ...d.data() } as Note);
  });
  return list;
}

// ==========================================
// 2. High-Fidelity Mock Implementation
// ==========================================

const MOCK_UID = "local-user-uid";
const MOCK_PEER_UID = "peer-aki-uid";
const MOCK_PAIRING_ID = "mock-pairing-123";

// In-Memory state for local preview
const mockState = {
  user: {
    uid: MOCK_UID,
    status: "idle" as "idle" | "matching" | "paired",
    currentPeerId: null as string | null,
    currentPairingId: null as string | null,
    habitCategory: null as HabitCategory | null,
    goalDescription: null as string | null,
    peerGoal: null as string | null,
    streakCount: 0,
    displayName: null as string | null,
    photoURL: null as string | null
  },
  lastActiveDateCode: null as string | null,
  notes: [] as Note[],
  listeners: [] as ((user: UserState | null) => void)[],
  notesListeners: [] as ((notes: Note[]) => void)[]
};

// Seed storage to survive refresh
function loadGoogleGsiScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) {
      resolve((window as any).google);
      return;
    }
    
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve((window as any).google);
        } else if (attempts > 50) {
          clearInterval(interval);
          reject(new Error("Timeout waiting for Google Identity Services SDK."));
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve((window as any).google);
        } else if (attempts > 30) {
          clearInterval(interval);
          reject(new Error("Timeout waiting for Google Identity Services SDK."));
        }
      }, 50);
    };
    script.onerror = () => reject(new Error("Google GSI script failed to load."));
    document.body.appendChild(script);
  });
}

function saveMockState() {
  localStorage.setItem("dot_mock_uid", mockState.user.uid);
  localStorage.setItem("dot_mock_user_status", mockState.user.status);
  localStorage.setItem("dot_mock_current_peer", mockState.user.currentPeerId || "");
  localStorage.setItem("dot_mock_pairing_id", mockState.user.currentPairingId || "");
  localStorage.setItem("dot_mock_category", mockState.user.habitCategory || "");
  localStorage.setItem("dot_mock_goal", mockState.user.goalDescription || "");
  localStorage.setItem("dot_mock_peer_goal", mockState.user.peerGoal || "");
  localStorage.setItem("dot_mock_streak", mockState.user.streakCount.toString());
  localStorage.setItem("dot_mock_last_active_date", mockState.lastActiveDateCode || "");
  localStorage.setItem("dot_mock_display_name", mockState.user.displayName || "");
  localStorage.setItem("dot_mock_photo_url", mockState.user.photoURL || "");
  localStorage.setItem("dot_mock_notes", JSON.stringify(mockState.notes));
}

function loadMockState() {
  const status = localStorage.getItem("dot_mock_user_status");
  if (status) {
    mockState.user.uid = localStorage.getItem("dot_mock_uid") || MOCK_UID;
    mockState.user.status = status as any;
    mockState.user.currentPeerId = localStorage.getItem("dot_mock_current_peer") || null;
    mockState.user.currentPairingId = localStorage.getItem("dot_mock_pairing_id") || null;
    mockState.user.habitCategory = (localStorage.getItem("dot_mock_category") as any) || null;
    mockState.user.goalDescription = localStorage.getItem("dot_mock_goal") || null;
    mockState.user.peerGoal = localStorage.getItem("dot_mock_peer_goal") || null;
    mockState.user.streakCount = parseInt(localStorage.getItem("dot_mock_streak") || "0", 10);
    mockState.lastActiveDateCode = localStorage.getItem("dot_mock_last_active_date") || null;
    mockState.user.displayName = localStorage.getItem("dot_mock_display_name") || null;
    mockState.user.photoURL = localStorage.getItem("dot_mock_photo_url") || null;
    mockState.notes = JSON.parse(localStorage.getItem("dot_mock_notes") || "[]");
  }
}

// Initialize mock data
loadMockState();

function triggerUserListeners() {
  saveMockState();
  mockState.listeners.forEach((cb) => cb({ ...mockState.user }));
}

function triggerNotesListeners() {
  saveMockState();
  const dateCode = new Date().toISOString().split("T")[0];
  const currentPairingNotes = mockState.notes.filter(
    (n) => n.pairingId === mockState.user.currentPairingId && n.dateCode === dateCode
  );
  mockState.notesListeners.forEach((cb) => cb([...currentPairingNotes]));
}

async function mockSignIn(): Promise<SignInResult> {
  try {
    const google = await loadGoogleGsiScript();
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "221994657450-e1fj9dmupj3bvlmb3n55i6cf2kpi2suv.apps.googleusercontent.com";

    if (!clientId) {
      throw new Error("VITE_GOOGLE_CLIENT_ID is not configured.");
    }

    return new Promise((resolve, reject) => {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "profile email",
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              reject(new Error(tokenResponse.error_description || "Google sign-in error"));
              return;
            }

            try {
              // Fetch user profile info
              const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
              if (!res.ok) {
                throw new Error("Failed to fetch user profile from Google");
              }
              const profile = await res.json();

              const realResult = {
                uid: profile.sub, // Google unique user identifier
                displayName: profile.name,
                photoURL: profile.picture
              };

              // Update mock state values
              mockState.user.uid = realResult.uid;
              mockState.user.displayName = realResult.displayName;
              mockState.user.photoURL = realResult.photoURL;

              // Save to localStorage
              saveMockState();
              
              // Trigger listener updates
              triggerUserListeners();

              resolve(realResult);
            } catch (fetchErr) {
              reject(fetchErr);
            }
          },
        });

        client.requestAccessToken();
      } catch (err) {
        reject(err);
      }
    });
  } catch (err) {
    console.error("Sign in failed:", err);
    throw err;
  }
}

function mockObserveUser(_uid: string, callback: (user: UserState | null) => void): () => void {
  mockState.listeners.push(callback);
  
  setTimeout(() => {
    callback({ ...mockState.user });
  }, 100);
  
  return () => {
    mockState.listeners = mockState.listeners.filter((cb) => cb !== callback);
  };
}

async function mockStartMatching(_uid: string, category: HabitCategory, goal: string): Promise<void> {
  mockState.user.status = "matching";
  mockState.user.habitCategory = category;
  mockState.user.goalDescription = goal;
  triggerUserListeners();
  
  // Custom mock goals for Aki based on chosen habit category
  const peerGoals: Record<HabitCategory, string> = {
    coding: "Practice data structures in Rust and solve 2 LeetCode problems.",
    fitness: "Complete a 5km outdoor jog and 15 minutes of core stretches.",
    writing: "Draft 500 words for Chapter 3 of my sci-fi micro-novel.",
    mindfulness: "Meditate for 20 minutes in the morning and write in my gratitude journal."
  };

  // Simulate pairing with "Aki" after 3 seconds
  setTimeout(() => {
    if (mockState.user.status !== "matching") return;
    
    mockState.user.status = "paired";
    mockState.user.currentPeerId = MOCK_PEER_UID;
    mockState.user.currentPairingId = MOCK_PAIRING_ID;
    mockState.user.peerGoal = peerGoals[category];
    mockState.user.streakCount = mockState.user.streakCount || 1;
    
    mockState.notes = [];
    
    triggerUserListeners();
    triggerNotesListeners();
  }, 3000);
}

async function mockCancelMatching(_uid: string): Promise<void> {
  mockState.user.status = "idle";
  mockState.user.currentPeerId = null;
  mockState.user.currentPairingId = null;
  mockState.user.habitCategory = null;
  mockState.user.goalDescription = null;
  mockState.user.peerGoal = null;
  mockState.user.streakCount = 0;
  mockState.lastActiveDateCode = null;
  mockState.notes = [];
  triggerUserListeners();
}

async function mockDisconnectPairing(_uid: string, _pairingId: string): Promise<void> {
  mockState.user.status = "idle";
  mockState.user.currentPeerId = null;
  mockState.user.currentPairingId = null;
  mockState.user.habitCategory = null;
  mockState.user.goalDescription = null;
  mockState.user.peerGoal = null;
  mockState.user.streakCount = 0;
  mockState.lastActiveDateCode = null;
  mockState.notes = [];
  triggerUserListeners();
  triggerNotesListeners();
}

async function mockSubmitDailyNote(pairingId: string, uid: string, content: string): Promise<void> {
  const dateCode = new Date().toISOString().split("T")[0];
  
  // 1. Add user's check-in note
  const userNote: Note = {
    id: `note-${Math.random()}`,
    pairingId,
    senderId: uid,
    content,
    dateCode,
    createdAt: new Date().toISOString()
  };
  mockState.notes.push(userNote);
  triggerNotesListeners();
  
  // 2. Simulate Peer "Aki" responding after 2.5 seconds
  const mockResponses: Record<HabitCategory, string[]> = {
    coding: [
      "Wrote 4 utility functions in Rust today. Had a compiler error about lifetimes that took 30 mins, but finally fixed it!",
      "Solved 2 LeetCode problems (one medium, one easy). Felt good to get the sliding window algorithm down.",
      "Coded out the auth middleware in my hobby project. Keeping the codebase clean today.",
    ],
    fitness: [
      "Ran 5.2km! Felt a bit tired at km 3, but pushed through. Beautiful sunset outside today.",
      "Just finished 45 minutes of heavy weight training and core exercises. Sore but accomplished.",
      "Completed a active recovery day. 30 minutes of stretching and yoga. Feeling loose and relaxed.",
    ],
    writing: [
      "Wrote 520 words today. The conversation between the characters felt a bit blocky, but I got the scene finished.",
      "Polished chapter 2 edits. Removed about 300 words of filler text. Much tighter pacing now.",
      "Drafted a quick outline for the next chapter. The story is heading in a fun, unexpected direction.",
    ],
    mindfulness: [
      "Completed a 20-minute silent meditation session. Found it hard to settle my thoughts today, but stayed seated.",
      "Wrote down three things I was grateful for and did 10 minutes of deep breathing exercises. Calming.",
      "Spent 15 minutes reflecting in my journal. It felt nice to write down thoughts without editing them."
    ]
  };
  
  setTimeout(() => {
    const peerAlreadySent = mockState.notes.some((n) => n.senderId === MOCK_PEER_UID);
    if (mockState.user.status === "paired" && !peerAlreadySent) {
      const category = mockState.user.habitCategory || "coding";
      const responses = mockResponses[category];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const peerNote: Note = {
        id: `note-${Math.random()}`,
        pairingId,
        senderId: MOCK_PEER_UID,
        content: randomResponse,
        dateCode,
        createdAt: new Date().toISOString()
      };
      mockState.notes.push(peerNote);
      
      const lastActive = mockState.lastActiveDateCode;
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayCode = yesterday.toISOString().split("T")[0];
      
      if (lastActive === yesterdayCode) {
        mockState.user.streakCount += 1;
      } else if (lastActive !== dateCode) {
        mockState.user.streakCount = mockState.user.streakCount + 1;
      }
      
      mockState.lastActiveDateCode = dateCode;
      
      triggerUserListeners();
      triggerNotesListeners();
    }
  }, 2500);
}

function mockObserveDailyNotes(pairingId: string, callback: (notes: Note[]) => void): () => void {
  mockState.notesListeners.push(callback);
  
  const dateCode = new Date().toISOString().split("T")[0];
  const currentPairingNotes = mockState.notes.filter(
    (n) => n.pairingId === pairingId && n.dateCode === dateCode
  );
  setTimeout(() => {
    callback([...currentPairingNotes]);
  }, 100);
  
  return () => {
    mockState.notesListeners = mockState.notesListeners.filter((cb) => cb !== callback);
  };
}

async function mockSignOut(): Promise<void> {
  // Reset memory state to baseline mock values
  mockState.user.uid = MOCK_UID;
  mockState.user.status = "idle";
  mockState.user.currentPeerId = null;
  mockState.user.currentPairingId = null;
  mockState.user.habitCategory = null;
  mockState.user.goalDescription = null;
  mockState.user.peerGoal = null;
  mockState.user.streakCount = 0;
  mockState.lastActiveDateCode = null;
  mockState.user.displayName = null;
  mockState.user.photoURL = null;
  mockState.notes = [];

  // Remove mock items from local storage
  localStorage.removeItem("dot_mock_uid");
  localStorage.removeItem("dot_mock_user_status");
  localStorage.removeItem("dot_mock_current_peer");
  localStorage.removeItem("dot_mock_pairing_id");
  localStorage.removeItem("dot_mock_category");
  localStorage.removeItem("dot_mock_goal");
  localStorage.removeItem("dot_mock_peer_goal");
  localStorage.removeItem("dot_mock_streak");
  localStorage.removeItem("dot_mock_last_active_date");
  localStorage.removeItem("dot_mock_display_name");
  localStorage.removeItem("dot_mock_photo_url");
  localStorage.removeItem("dot_mock_notes");

  triggerUserListeners();
}

async function mockGetUserNotesHistory(uid: string): Promise<Note[]> {
  return mockState.notes.filter(n => n.senderId === uid);
}

// ==========================================
// 3. Export Unified API Layer
// ==========================================

export const isDemoMode = !isFirebaseConfigured;

export const api = {
  signInAnonymously: isFirebaseConfigured ? liveSignIn : mockSignIn,
  observeUser: isFirebaseConfigured ? liveObserveUser : mockObserveUser,
  startMatching: isFirebaseConfigured ? liveStartMatching : mockStartMatching,
  cancelMatching: isFirebaseConfigured ? liveCancelMatching : mockCancelMatching,
  disconnectPairing: isFirebaseConfigured ? liveDisconnectPairing : mockDisconnectPairing,
  submitDailyNote: isFirebaseConfigured ? liveSubmitDailyNote : mockSubmitDailyNote,
  observeDailyNotes: isFirebaseConfigured ? liveObserveDailyNotes : mockObserveDailyNotes,
  signOut: isFirebaseConfigured ? liveSignOut : mockSignOut,
  getUserNotesHistory: isFirebaseConfigured ? liveGetUserNotesHistory : mockGetUserNotesHistory
};
