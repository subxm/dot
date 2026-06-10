import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { api, isDemoMode } from '../firebase'
import type { UserState, Note } from '../firebase'

function formatNoteTime(createdAt: any): string {
  if (!createdAt) return "Recently";
  let date: Date;
  if (typeof createdAt.toDate === 'function') {
    date = createdAt.toDate();
  } else if (createdAt.seconds) {
    date = new Date(createdAt.seconds * 1000);
  } else {
    date = new Date(createdAt);
  }
  if (isNaN(date.getTime())) {
    return "Recently";
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface DashboardProps {
  uid: string;
  userState: UserState;
  onOpenInfo: (tab: 'philosophy' | 'trust' | 'access' | 'tribe') => void;
}

export function Dashboard({ uid, userState, onOpenInfo }: DashboardProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [noteInput, setNoteInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  const [countdown, setCountdown] = useState("")
  const [showMatchedToast, setShowMatchedToast] = useState(false)

  // 1. Countdown to next UTC midnight
  useEffect(() => {
    function updateCountdown() {
      const now = new Date()
      const utcMidnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0
      ))
      const diffMs = utcMidnight.getTime() - now.getTime()
      if (diffMs <= 0) {
        setCountdown("00:00:00")
        return
      }
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      const secInt = Math.floor((diffMs % (1000 * 60)) / 1000)

      const pad = (n: number) => n.toString().padStart(2, '0')
      setCountdown(`${pad(hours)}h ${pad(minutes)}m ${pad(secInt)}s`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [])

  // 2. Observe daily notes once paired
  useEffect(() => {
    if (userState.status === 'paired' && userState.currentPairingId) {
      setShowMatchedToast(true)
      const t = setTimeout(() => setShowMatchedToast(false), 5000)

      const unsubscribe = api.observeDailyNotes(userState.currentPairingId, (fetchedNotes) => {
        setNotes(fetchedNotes)
      })
      
      return () => {
        unsubscribe()
        clearTimeout(t)
      }
    } else {
      setNotes([])
    }
  }, [userState.status, userState.currentPairingId])

  // 3. Match logic destructuring
  const myNote = notes.find(n => n.senderId === uid)
  const peerNote = notes.find(n => n.senderId === userState.currentPeerId)

  const hasSentMyNote = !!myNote
  const hasSentPeerNote = !!peerNote
  const canSeePeerNote = hasSentMyNote && hasSentPeerNote

  const handleCancelMatching = async () => {
    try {
      await api.cancelMatching(uid)
    } catch (e) {
      console.error("Failed to cancel matching:", e)
    }
  }

  const handleDisconnect = async () => {
    if (!userState.currentPairingId) return
    try {
      await api.disconnectPairing(uid, userState.currentPairingId, userState.currentPeerId)
      setShowDisconnectConfirm(false)
    } catch (e) {
      console.error("Failed to disconnect pairing:", e)
    }
  }

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteInput.trim() || noteInput.length > 280 || isSubmitting || !userState.currentPairingId) return

    setIsSubmitting(true)
    try {
      await api.submitDailyNote(userState.currentPairingId, uid, noteInput.trim())
      setNoteInput("")
    } catch (e) {
      console.error("Failed to submit note:", e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCategory = (cat: string | null) => {
    if (!cat) return ""
    return cat.charAt(0).toUpperCase() + cat.slice(1)
  }

  const getCategoryEmoji = (cat: string | null) => {
    if (cat === "coding") return "💻"
    if (cat === "fitness") return "🏋️"
    if (cat === "writing") return "✍️"
    if (cat === "mindfulness") return "🧘"
    return "🔥"
  }

  // ==========================================
  // VIEW: MATCHING / SEARCHING
  // ==========================================
  if (userState.status === 'matching') {
    return (
      <div className="min-h-screen bg-[#F3F4ED] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="relative flex items-center justify-center mb-8">
          <motion.div
            animate={{ scale: [0.9, 1.4, 0.9], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-44 h-44 rounded-full border border-[#0871E7]/20"
          />
          <motion.div
            animate={{ scale: [0.7, 1.2, 0.7], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute w-36 h-36 rounded-full border border-[#0871E7]/30"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-full bg-[#0871E7] flex items-center justify-center text-white font-instrument text-2xl shadow-xl"
          >
            {getCategoryEmoji(userState.habitCategory)}
          </motion.div>
        </div>

        <h2 className="font-instrument text-[28px] md:text-[36px] text-[#1a1a1a] tracking-tight leading-tight mb-2">
          Searching for a {formatCategory(userState.habitCategory)} partner...
        </h2>
        <p className="font-sans text-[14px] md:text-[16px] text-[#1a1a1a]/70 max-w-sm mx-auto leading-relaxed mb-4">
          Wait in silence. We are linking you with someone working on the same daily habit.
        </p>
        <p className="font-sans text-[12px] text-[#1a1a1a]/55 max-w-xs mx-auto mb-8 bg-black/5 py-1.5 px-3 rounded-full">
          Your goal: "{userState.goalDescription}"
        </p>

        {isDemoMode && (
          <div className="mb-6 py-2 px-4 rounded-full bg-[#0871E7]/10 text-[#0871E7] text-[12px] font-sans font-medium max-w-xs mx-auto animate-pulse">
            Local Preview Mode: Auto-pairs in 3s
          </div>
        )}

        <button
          onClick={handleCancelMatching}
          className="px-6 py-2 rounded-full border border-black/10 hover:bg-black/5 active:scale-[0.98] transition-all font-sans text-[14px] text-[#1a1a1a] cursor-pointer"
        >
          Cancel Search
        </button>
      </div>
    )
  }

  // ==========================================
  // VIEW: PAIRED / DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F3F4ED] pt-24 pb-12 px-4 md:px-8 select-text">
      {/* Matched Toast */}
      <AnimatePresence>
        {showMatchedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-24 left-1/2 z-50 bg-[#1a1a1a] text-[#F3F4ED] font-sans text-[13px] px-5 py-2.5 rounded-full border border-white/10 shadow-xl"
          >
            ✦ Accountability link active. Focus: {formatCategory(userState.habitCategory)}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto flex flex-col h-full">
        {/* Top Control Panel */}
        <div className="flex items-center justify-between border-b border-black/5 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-sans text-[13px] text-[#1a1a1a]/60">
              Buddy focus: <strong className="text-[#1a1a1a]/80 font-medium">{formatCategory(userState.habitCategory)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onOpenInfo('philosophy')}
              className="font-sans text-[13px] text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors cursor-pointer"
            >
              How it works
            </button>
            <button
              onClick={() => setShowDisconnectConfirm(true)}
              className="px-4 py-1.5 rounded-full text-rose-600 bg-rose-50 hover:bg-rose-100/50 active:scale-[0.98] transition-all font-sans text-[12px] font-medium cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Streak Header Display */}
        <div className="flex flex-col items-center justify-center mb-8">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/25 shadow-sm"
          >
            <span className="text-lg">🔥</span>
            <span className="font-sans text-[14px] font-semibold tracking-tight">
              {userState.streakCount} Day Streak
            </span>
          </motion.div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Card Left: Your Progress */}
          <div className="flex flex-col bg-white/60 backdrop-blur border border-black/5 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col mb-4 gap-1">
              <div className="flex items-center justify-between">
                <span className="font-instrument text-[20px] font-bold text-[#1a1a1a]">Your Goal</span>
                <span className="font-sans text-[11px] text-white bg-black/60 px-2 py-0.5 rounded-full font-medium">
                  {getCategoryEmoji(userState.habitCategory)} {formatCategory(userState.habitCategory)}
                </span>
              </div>
              <p className="font-sans text-[13px] text-[#1a1a1a]/65 font-medium italic">
                "{userState.goalDescription}"
              </p>
            </div>

            {hasSentMyNote ? (
              <div className="flex-1 flex flex-col justify-between mt-4">
                <div className="flex-1">
                  <span className="font-sans text-[11px] uppercase tracking-wider text-[#1a1a1a]/40 block mb-1">
                    Your check-in today:
                  </span>
                  <p className="font-sans text-[15px] text-[#1a1a1a] leading-relaxed break-words font-light">
                    "{myNote?.content}"
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-black/5 flex items-center justify-between text-[11px] text-[#1a1a1a]/40 font-mono">
                  <span>Checked in</span>
                  <span>{formatNoteTime(myNote?.createdAt)}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitNote} className="flex-1 flex flex-col justify-between gap-4 mt-2">
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value.slice(0, 280))}
                  placeholder="What did you achieve today towards your goal? (max 280 characters)"
                  className="w-full flex-1 min-h-[140px] p-4 rounded-2xl bg-white/80 border border-black/10 focus:outline-none focus:border-[#0871E7] text-[14px] text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 resize-none font-sans leading-relaxed transition-colors"
                />
                
                <div className="flex items-center justify-between">
                  <span className={`text-[12px] font-mono ${noteInput.length >= 260 ? 'text-rose-500 font-semibold' : 'text-[#1a1a1a]/40'}`}>
                    {noteInput.length}/280
                  </span>
                  
                  <button
                    type="submit"
                    disabled={!noteInput.trim() || isSubmitting}
                    className="px-6 py-2 rounded-full bg-[#0871E7] disabled:bg-[#0871E7]/50 text-white font-sans text-[13px] font-medium transition-all shadow-[inset_0_-4px_4px_rgba(255,255,255,0.39)] outline outline-1 outline-[#0871E7] -outline-offset-1 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting..." : "Log Progress"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Card Right: Partner's Progress */}
          <div className="flex flex-col bg-white/60 backdrop-blur border border-black/5 rounded-3xl p-6 md:p-8 shadow-sm justify-between">
            <div className="w-full">
              <div className="flex flex-col mb-4 gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-instrument text-[20px] font-bold text-[#1a1a1a]">Partner's Goal</span>
                  <span className="font-sans text-[11px] text-[#1a1a1a]/40">Buddy</span>
                </div>
                <p className="font-sans text-[13px] text-[#1a1a1a]/65 font-medium italic">
                  "{userState.peerGoal}"
                </p>
              </div>

              {!hasSentPeerNote ? (
                // Case A: Peer hasn't sent their note yet
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1a]/5 flex items-center justify-center animate-pulse mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]/20" />
                  </div>
                  <p className="font-sans text-[13px] text-[#1a1a1a]/50 italic">
                    Partner is working today...
                  </p>
                  <p className="font-sans text-[11px] text-[#1a1a1a]/30 mt-1 max-w-[220px] mx-auto leading-normal">
                    Their check-in note will appear here when they log today's progress.
                  </p>
                </div>
              ) : !hasSentMyNote ? (
                // Case B: Peer sent theirs, but user hasn't sent theirs (Locked/Blurred state)
                <div className="relative py-8 flex flex-col justify-between">
                  <div className="select-none filter blur-[6px] opacity-40 font-sans text-[15px] leading-relaxed font-light mb-6">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam elementum sodales purus at finibus. Cras vitae diam id ante sollicitudin convallis a vel lorem.
                  </div>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 bg-white/10 rounded-2xl">
                    <svg className="w-6 h-6 text-[#0871E7] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="font-sans text-[13px] font-semibold text-[#1a1a1a] mb-0.5">
                      Partner completed their goal
                    </p>
                    <p className="font-sans text-[11px] text-[#1a1a1a]/60 leading-normal max-w-[210px]">
                      Log your progress on the left to unlock what your partner accomplished today.
                    </p>
                  </div>
                </div>
              ) : (
                // Case C: Both sent their notes (Revealed state)
                <div className="flex-1 flex flex-col justify-between mt-4">
                  <div>
                    <span className="font-sans text-[11px] uppercase tracking-wider text-[#1a1a1a]/40 block mb-1">
                      Partner's check-in today:
                    </span>
                    <p className="font-sans text-[15px] text-[#1a1a1a] leading-relaxed break-words font-light">
                      "{peerNote?.content}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {canSeePeerNote && (
              <div className="pt-4 border-t border-black/5 flex items-center justify-between text-[11px] text-[#1a1a1a]/40 font-mono">
                <span>Completed</span>
                <span>{formatNoteTime(peerNote?.createdAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Panel: Ephemeral Reset Indicator */}
        <div className="flex flex-col items-center justify-center p-6 bg-white/20 border border-black/5 rounded-3xl text-center">
          <span className="font-sans text-[11px] uppercase tracking-wider text-[#1a1a1a]/45 mb-1.5">
            Check-in window closes in
          </span>
          <span className="font-mono text-[22px] md:text-[26px] font-bold text-[#1a1a1a] tabular-nums tracking-tight">
            {countdown}
          </span>
          <p className="font-sans text-[11px] text-[#1a1a1a]/40 mt-1 max-w-xs">
            Submit progress before UTC midnight to maintain your streak. Slate resets daily.
          </p>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      <AnimatePresence>
        {showDisconnectConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDisconnectConfirm(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm cursor-pointer"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl bg-[#F3F4ED] border border-black/10 p-6 shadow-2xl text-center pointer-events-auto"
            >
              <h3 className="font-instrument text-[24px] text-[#1a1a1a] tracking-tight mb-2">
                Sever this link?
              </h3>
              <p className="font-sans text-[13px] text-[#1a1a1a]/70 leading-relaxed mb-6">
                You will immediately disconnect from your partner. Your shared streak will be reset to zero, and you can match for a new goal tomorrow.
              </p>
              
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleDisconnect}
                  className="w-full py-2.5 rounded-full bg-rose-600 text-white font-sans text-[13px] font-medium hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer shadow-[inset_0_-4px_4px_rgba(255,255,255,0.2)]"
                >
                  Yes, Disconnect
                </button>
                <button
                  onClick={() => setShowDisconnectConfirm(false)}
                  className="w-full py-2.5 rounded-full border border-black/10 hover:bg-black/5 active:scale-[0.99] text-[#1a1a1a] font-sans text-[13px] transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
