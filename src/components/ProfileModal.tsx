import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { api } from '../firebase'
import type { UserState, Note } from '../firebase'

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  userState: UserState;
  onSignOut: () => void;
}

export function ProfileModal({ isOpen, onClose, uid, userState, onSignOut }: ProfileModalProps) {
  const [history, setHistory] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch note history when modal opens
  useEffect(() => {
    if (isOpen && uid) {
      setIsLoading(true)
      api.getUserNotesHistory(uid)
        .then((data) => {
          setHistory(data)
        })
        .catch((err) => {
          console.error("Error loading note history:", err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isOpen, uid])

  // Calendar Math
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-indexed

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  const currentMonthName = monthNames[month]

  // Total days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Weekday index of 1st day of month (0 = Sun, 1 = Mon, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay()

  const weekdays = ["S", "M", "T", "W", "T", "F", "S"]

  // Build grid arrays
  const blanks = Array.from({ length: firstDayIndex })
  const days = Array.from({ length: daysInMonth }, (_, idx) => idx + 1)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/25 backdrop-blur-sm cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative z-10 w-full max-w-md h-full bg-[#F3F4ED] border-l border-black/10 shadow-2xl p-6 md:p-8 flex flex-col justify-between overflow-y-auto pointer-events-auto"
          >
            {/* Top Close Row */}
            <div className="flex items-center justify-between mb-8">
              <span className="font-instrument text-[24px] text-[#1a1a1a] tracking-tight font-bold select-none">
                Your Profile
              </span>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer text-[#1a1a1a]/70 hover:text-[#1a1a1a]"
                aria-label="Close profile"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Profile Info Header */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-black/5 mb-6">
              {userState.photoURL ? (
                <img 
                  src={userState.photoURL} 
                  alt={userState.displayName || "Google User"} 
                  className="w-20 h-20 rounded-full border-2 border-black/10 shadow-md mb-3 select-none"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#0871E7] text-white flex items-center justify-center font-sans text-3xl font-semibold uppercase shadow-md mb-3 select-none">
                  {userState.displayName ? userState.displayName.charAt(0) : "G"}
                </div>
              )}
              <h3 className="font-instrument text-[22px] font-bold text-[#1a1a1a] leading-none mb-1">
                {userState.displayName || "Google Buddy"}
              </h3>
              <span className="font-sans text-[12px] text-[#1a1a1a]/50">
                Google Authenticated
              </span>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 select-none">
              <div className="bg-white/40 border border-black/5 rounded-2xl p-4 flex flex-col gap-1">
                <span className="font-sans text-[11px] uppercase tracking-wider text-[#1a1a1a]/45">
                  Current Streak
                </span>
                <span className="font-mono text-[24px] font-bold text-orange-600 flex items-center gap-1.5 leading-none">
                  🔥 {userState.streakCount}
                </span>
              </div>

              <div className="bg-white/40 border border-black/5 rounded-2xl p-4 flex flex-col gap-1">
                <span className="font-sans text-[11px] uppercase tracking-wider text-[#1a1a1a]/45">
                  Total Check-ins
                </span>
                <span className="font-mono text-[24px] font-bold text-[#0871E7] leading-none">
                  ✓ {history.length}
                </span>
              </div>
            </div>

            {/* Calendar Consistency Map */}
            <div className="flex-1 flex flex-col mb-6 bg-white/40 border border-black/5 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 select-none">
                <span className="font-instrument text-[18px] font-bold text-[#1a1a1a]">
                  Consistency Map
                </span>
                <span className="font-sans text-[11px] font-medium text-[#1a1a1a]/50">
                  {currentMonthName} {year}
                </span>
              </div>

              {isLoading ? (
                <div className="flex-1 flex items-center justify-center text-[#1a1a1a]/40 font-sans text-xs">
                  Loading history...
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-1 font-sans text-[10px] font-bold text-[#1a1a1a]/40 uppercase tracking-wider text-center border-b border-black/5 pb-1">
                    {weekdays.map((w, idx) => (
                      <div key={idx}>{w}</div>
                    ))}
                  </div>

                  {/* Grid cells */}
                  <div className="grid grid-cols-7 gap-1.5 text-center items-center">
                    {/* Blanks */}
                    {blanks.map((_, idx) => (
                      <div key={`blank-${idx}`} className="aspect-square" />
                    ))}

                    {/* Days */}
                    {days.map((d) => {
                      const dateCode = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                      const completed = history.some((n) => n.dateCode === dateCode)
                      const isToday = d === now.getDate()
                      
                      return (
                        <div 
                          key={d}
                          className="aspect-square flex items-center justify-center relative rounded-full"
                        >
                          {completed ? (
                            <div className="w-full h-full rounded-full bg-[#0871E7]/10 border border-[#0871E7]/25 flex items-center justify-center text-[#0871E7] font-mono text-[12px] font-bold shadow-sm select-none">
                              🔥
                            </div>
                          ) : (
                            <span className={`font-mono text-[12px] select-none ${
                              isToday 
                                ? 'text-[#0871E7] border border-[#0871E7]/40 w-full h-full rounded-full flex items-center justify-center font-bold' 
                                : 'text-[#1a1a1a]/60'
                            }`}>
                              {d}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sign Out Button (Drawer Bottom) */}
            <button
              onClick={() => {
                onSignOut()
                onClose()
              }}
              className="w-full py-3 rounded-full border border-rose-200 bg-rose-50/20 hover:bg-rose-50 active:scale-[0.99] text-rose-600 font-sans text-[13px] font-medium transition-all cursor-pointer text-center"
            >
              Sign out
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
