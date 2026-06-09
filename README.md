<div align="center">
  
  # dot.
  
  ### *Daily progress. Silent support.*
  
  [Philosophy](#-the-philosophy) • [The Protocol](#-the-protocol) • [Tech Stack](#-technical-architecture) • [Getting Started](#-getting-started)

  <br />
</div>

**dot.** is a premium, distraction-free 1:1 anonymous habit accountability partner web application. Built with **React 19**, **Vite**, **Tailwind CSS v4**, and **Google Identity Services (GSI) OAuth**, it helps users build consistent habits in Coding, Fitness, Writing, and Mindfulness.

Unlike traditional, noisy social tracking apps that distract you with infinite scrolling, comments, and likes, **dot.** is designed around the quiet power of raw output, complete anonymity, and strict reciprocity.

---

## 🎨 Key Features & Aesthetic Elements

### ✦ Premium Minimalist UI
- **Beach Background & Nokia Overlay**: A calming beach video background featuring a retro Nokia 3310 mockup. The retro phone screen dynamically types messaging prompts (`Are you here?`, `Yes, I am.`, `Speak soon.`) to set a quiet, consistent mood.
- **Glassmorphism**: Floating components use polished border highlights and backdrop blur filters (`backdrop-blur-md bg-white/20 border-black/10`).
- **Floating User Profile**: Your Google avatar and status badge float in the top-right corner, completely separate from the centered capsule Navbar to preserve visual balance.

### ✦ Direct Google OAuth (No Passwords)
- **Zero Friction**: Removed intermediate login walls. Clicking "Sign in" directly launches the official Google Account popup chooser.
- **Real Profiles**: Dynamically fetches your Google account's display name, email, and avatar picture.
- **Refresh Persistence**: Google user identifiers and session states are securely cached in LocalStorage to prevent onboarding prompts from popping up on page refresh.

### ✦ The Reciprocal "Frosted Blur"
- **Transparency Locked**: To prevent passive consumption, your partner's logged daily task is locked behind a frosted blur overlay.
- **The Key**: Submitting your own check-in (maximum 280 characters) unlocks and reveals what your partner achieved today.

### ✦ shared Fire Streaks
- **Mutual Commitment**: Both partners must check in before UTC midnight to increase their shared fire streak (`🔥`). If either partner fails to check in, the fire resets to zero.
- **Clean Severing**: Severing a partnership resets the streak to 0, returning both users to their respective matching pools.

---

## ⚙️ The Protocol (How it Works)

1. **Commit**: Log in with Google, choose a tribe (💻 Coding, 🏋️ Fitness, ✍️ Writing, 🧘 Mindfulness), and write your daily goal description (max 60 characters).
2. **Match**: The matching engine pairs you with one anonymous partner committing to the same discipline. You cannot see their email, name, or photo—only their goal description.
3. **Write**: Post what you accomplished today toward your goal (max 280 characters) before the countdown reaches 00:00:00 UTC.
4. **Reveal**: Instantly unblur your buddy's progress log for the day and fuel your shared streak.

---

## 🛠️ Technical Architecture

- **Core Framework**: React 19 (TypeScript)
- **Bundler**: Vite
- **Styling**: Tailwind CSS v4 (Vanilla HSL-tailored custom color systems)
- **Animations**: Framer Motion (`motion/react`)
- **Authentication**: Direct Google Identity Services (GSI) API token client integration
- **Database/Backend (Unified API)**:
  - **Live Mode**: Firebase Auth & Firestore real-time snapshot sync (triggered when configuration is present in `.env`).
  - **Demo/Mock Mode**: High-fidelity in-memory state engine mirrored dynamically in `LocalStorage` with support for profile consistency calendars, matchmaking, notes submissions, and streak calculations.

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/subxm/DOT.git
cd DOT

# Install dependencies
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and add your Google OAuth Client ID:
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

*Optional Live Mode setup*: If you wish to connect to a live Firebase backend, add your Firebase config keys:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Run Locally
```bash
# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
```bash
# Compile TypeScript and compile assets
npm run build
```
Production assets will be built in the `dist` folder.

---

<div align="center">
  <p>Created with dedication to quiet consistency. ✦</p>
</div>
