import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { api } from './firebase'
import type { UserState, HabitCategory } from './firebase'
import { InfoModal } from './components/InfoModal'
import type { InfoTab } from './components/InfoModal'
import { Dashboard } from './components/Dashboard'
import { ProtocolSection } from './components/ProtocolSection'
import { ProfileModal } from './components/ProfileModal'

// ==========================================
// 1. TypingMessages Component (Retro Phone Overlay)
// ==========================================
export function TypingMessages() {
  const messages = ["Are you here?", "Yes, I am.", "Speak soon."]
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0)
  const [text, setText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let timer: number
    const targetText = messages[currentMsgIndex]

    if (!isDeleting) {
      if (text.length < targetText.length) {
        timer = window.setTimeout(() => {
          setText(targetText.substring(0, text.length + 1))
        }, 100)
      } else {
        timer = window.setTimeout(() => {
          setIsDeleting(true)
        }, 2000)
      }
    } else {
      if (text.length > 0) {
        timer = window.setTimeout(() => {
          setText(targetText.substring(0, text.length - 1))
        }, 50)
      } else {
        setIsDeleting(false)
        setCurrentMsgIndex((prevIndex) => (prevIndex + 1) % messages.length)
      }
    }

    return () => clearTimeout(timer)
  }, [text, isDeleting, currentMsgIndex])

  return (
    <div className="absolute left-[48.5%] md:left-[47.5%] lg:left-[48.5%] -translate-x-1/2 bottom-[32%] z-30 w-[110px] sm:w-[130px] flex justify-start text-left pointer-events-none select-none">
      <span className="font-nokia text-[#2A3616] text-[10px] sm:text-[14px] leading-tight break-words min-h-[1.5em] flex items-center">
        <span>{text}</span>
        <motion.span
          className="inline-block w-1.5 h-3 bg-[#2A3616] ml-1 align-middle"
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </span>
    </div>
  )
}

// ==========================================
// 2. Navbar Component
// ==========================================
interface NavbarProps {
  onOpenInfo: (tab: InfoTab) => void;
  onLinkUp: () => void;
  userState: UserState | null;
  isAuthLoading: boolean;
}

export function Navbar({ onOpenInfo, onLinkUp, userState, isAuthLoading }: NavbarProps) {
  const links: { label: string; id: InfoTab }[] = [
    { label: "The Protocol", id: "philosophy" },
    { label: "Trust & Privacy", id: "trust" },
    { label: "Access & Flow", id: "access" },
    { label: "Tribe Matching", id: "tribe" }
  ]

  const handleCtaClick = () => {
    if (isAuthLoading) return
    onLinkUp()
  }

  const showLinkUp = userState && userState.status === 'idle'
  const showSignIn = !userState

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50 pointer-events-none">
      <nav className="pointer-events-auto backdrop-blur-md bg-white/20 border border-black/10 rounded-full flex items-center justify-between px-6 py-3 md:px-8">
        {/* Logo */}
        <a href="#" className="font-instrument text-[28px] tracking-tight text-[#1a1a1a] hover:opacity-80 transition-opacity select-none">
          dot.
        </a>

        {/* Links */}
        <div className="hidden md:flex items-center gap-10">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => onOpenInfo(link.id)}
              className="font-sans text-[14px] text-[#1a1a1a] transition-opacity duration-300 hover:opacity-50 cursor-pointer bg-transparent border-none focus:outline-none font-medium"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* CTA Button (Sign in / Link up) */}
        {showSignIn || showLinkUp ? (
          <button 
            onClick={handleCtaClick}
            disabled={isAuthLoading}
            className="group relative px-6 py-2.5 rounded-full bg-[#0871E7] disabled:bg-[#0871E7]/80 text-white font-sans text-[14px] font-medium transition-transform active:scale-[0.98] cursor-pointer disabled:cursor-default shadow-[inset_0_-4px_4px_rgba(255,255,255,0.39)] outline outline-1 outline-[#0871E7] -outline-offset-1"
          >
            {/* Subtle top glint effect */}
            <span className="absolute w-[80%] h-4 left-[10%] top-[1px] bg-gradient-to-b from-[#DEF0FC] to-transparent rounded-[12px] transition-transform duration-300 origin-center group-hover:scale-x-105 pointer-events-none" />
            <span className="relative z-10">
              {isAuthLoading ? "Loading..." : showSignIn ? "Sign in" : "Link up"}
            </span>
          </button>
        ) : (
          /* Invisible spacer to maintain centered alignment of menu links when no button is rendered */
          <div className="w-[88px] invisible" />
        )}
      </nav>
    </div>
  )
}

// ==========================================
// 3. Hero Component
// ==========================================
export function Hero() {
  return (
    <div className="relative min-h-screen w-full bg-[#F3F4ED] pt-32 md:pt-40 flex flex-col items-center justify-start overflow-hidden">
      {/* Video Background (Original scale-100 composition) */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260427_054418_a6d194f0-ac86-4df9-abe5-ded73e596d7c.mp4"
        />
        {/* Soft tint overlay */}
        <div className="absolute inset-0 bg-white/5 z-10 pointer-events-none" />
      </div>

      {/* Hero Text Container */}
      <div className="relative z-20 pointer-events-none text-center px-6 max-w-4xl mx-auto flex flex-col items-center">
        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="font-instrument text-[38px] md:text-[56px] lg:text-[72px] leading-[0.85] tracking-tight text-[#1a1a1a] mb-6 select-none"
        >
          Daily progress. <br /> Silent support.
        </motion.div>

        {/* Sub-headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="font-sans text-[16px] md:text-[18px] text-[#1a1a1a]/70 leading-relaxed font-normal max-w-xl mx-auto select-none"
        >
          Linked with a single anonymous partner working on the same habit. Share your daily achievements. A quiet rhythm of accountability.
        </motion.div>
      </div>

      {/* Typing Messages Overlay on Phone */}
      <TypingMessages />
    </div>
  )
}

// ==========================================
// 4. Main App Component
// ==========================================
export default function App() {
  const [uid, setUid] = useState<string | null>(null)
  const [user, setUser] = useState<UserState | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [activeInfoTab, setActiveInfoTab] = useState<InfoTab>('philosophy')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const triggerOnboardingOnLoad = useRef(false)

  // Onboarding Form States
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | null>(null)
  const [goalText, setGoalText] = useState("")

  // Restore stored session on mount
  useEffect(() => {
    const storedUid = localStorage.getItem("dot_user_uid")
    if (storedUid) {
      setUid(storedUid)
    } else {
      setIsAuthLoading(false)
    }
  }, [])

  // Listen to user status subscription reactively
  useEffect(() => {
    if (!uid) {
      setUser(null)
      return
    }

    setIsAuthLoading(true)
    const unsubscribe = api.observeUser(uid, (state) => {
      setUser(state)
      setIsAuthLoading(false)
      
      // Show goal onboarding modal if user is idle AND we explicitly flagged it (after clicking Link up to sign in)
      if (state && state.status === "idle") {
        if (triggerOnboardingOnLoad.current) {
          setShowOnboarding(true)
          triggerOnboardingOnLoad.current = false
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [uid])

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true)
    try {
      const loggedResult = await api.signInAnonymously() // Google pop-up sign in
      localStorage.setItem("dot_user_uid", loggedResult.uid)
      setUid(loggedResult.uid)
    } catch (e) {
      console.error("Sign in failed:", e)
      setIsAuthLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await api.signOut()
    } catch (e) {
      console.error("Sign out failed:", e)
    }
    localStorage.removeItem("dot_user_uid")
    setUid(null)
    setUser(null)
  }

  const handleNavbarLinkUp = async () => {
    if (!uid) {
      // Trigger login, and automatically flag the onboarding modal to open once logged in
      triggerOnboardingOnLoad.current = true
      await handleGoogleSignIn()
    } else if (user && user.status === 'idle') {
      setShowOnboarding(true)
    }
  }

  const handleStartMatching = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uid || !selectedCategory || !goalText.trim()) return

    setIsAuthLoading(true)
    try {
      await api.startMatching(uid, selectedCategory, goalText.trim())
      setShowOnboarding(false)
    } catch (e) {
      console.error("Error entering matchmaking:", e)
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleOpenInfo = (tab: InfoTab) => {
    if (tab === 'philosophy' && !showDashboard) {
      const element = document.getElementById('protocol-section')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    setActiveInfoTab(tab)
    setIsInfoOpen(true)
  }

  // Determine if we should show the dashboard (matching or paired) or landing page
  const showDashboard = user && (user.status === 'matching' || user.status === 'paired')

  return (
    <div className="min-h-screen bg-[#F3F4ED] w-full selection:bg-[#0871E7]/20 relative">
      <Navbar 
        onOpenInfo={handleOpenInfo}
        onLinkUp={handleNavbarLinkUp}
        userState={user}
        isAuthLoading={isAuthLoading}
      />

      {/* Floating User Avatar & Status Badge (Extreme Right) */}
      {user && (
        <div className="fixed top-[30px] right-8 z-50 flex items-center gap-3">
          {user.status !== 'idle' && (
            <span className="font-sans text-[11px] font-bold text-[#1a1a1a]/70 bg-white/80 backdrop-blur-sm border border-black/10 px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm select-none">
              {user.status === 'matching' ? "Matching" : "Paired"}
            </span>
          )}
          <div className="relative group">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || "Google User"} 
                className="w-9 h-9 rounded-full border border-black/15 shadow-md select-none cursor-pointer"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#0871E7] text-white flex items-center justify-center font-sans text-sm font-semibold uppercase shadow-md select-none cursor-pointer">
                {user.displayName ? user.displayName.charAt(0) : "G"}
              </div>
            )}
            
            {/* Profile Dropdown Menu */}
            <div className="absolute right-0 top-full pt-2 hidden group-hover:block pointer-events-auto min-w-[120px]">
              <div className="bg-white border border-black/10 rounded-2xl shadow-xl overflow-hidden flex flex-col p-1.5 gap-1">
                <button 
                  onClick={() => setIsProfileOpen(true)}
                  className="w-full text-left px-3 py-2 rounded-xl text-[12px] text-[#1a1a1a]/85 font-sans hover:bg-black/5 cursor-pointer font-medium whitespace-nowrap"
                >
                  View Profile
                </button>
                <button 
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 rounded-xl text-[12px] text-rose-600 font-sans hover:bg-rose-50/50 active:bg-rose-50 cursor-pointer font-medium whitespace-nowrap"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showDashboard && uid ? (
        <Dashboard 
          uid={uid} 
          userState={user} 
          onOpenInfo={handleOpenInfo}
        />
      ) : (
        <div className="relative w-full flex flex-col">
          <Hero />
          <div id="protocol-section" className="w-full">
            <ProtocolSection />
          </div>
        </div>
      )}

      {/* Onboarding Goal Setup Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOnboarding(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-md cursor-pointer"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-[#F3F4ED] border border-black/10 p-6 md:p-8 shadow-2xl text-left pointer-events-auto"
            >
              <h2 className="font-instrument text-[26px] md:text-[30px] leading-tight text-[#1a1a1a] tracking-tight mb-2">
                Choose Your Daily Slate
              </h2>
              <p className="font-sans text-[13px] text-[#1a1a1a]/70 mb-6 leading-relaxed">
                Select your focus area and specify your daily milestone. We'll link you with a partner working on the same habit.
              </p>

              <form onSubmit={handleStartMatching} className="flex flex-col gap-5">
                {/* Step 1: Select Habit Category */}
                <div className="flex flex-col gap-2">
                  <span className="font-sans text-[12px] font-semibold uppercase tracking-wider text-[#1a1a1a]/50">
                    1. Habit Focus
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["coding", "fitness", "writing", "mindfulness"] as HabitCategory[]).map((cat) => {
                      const icons: Record<HabitCategory, string> = {
                        coding: "💻 Coding",
                        fitness: "🏋️ Fitness",
                        writing: "✍️ Writing",
                        mindfulness: "🧘 Mindfulness"
                      }
                      const active = selectedCategory === cat
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`py-3 px-4 rounded-xl border font-sans text-[13px] font-medium text-left transition-all active:scale-[0.98] cursor-pointer ${
                            active 
                              ? "bg-[#0871E7] text-white border-[#0871E7] shadow-[inset_0_-2px_4px_rgba(255,255,255,0.2)]" 
                              : "bg-white/50 text-[#1a1a1a] border-black/10 hover:bg-white/80"
                          }`}
                        >
                          {icons[cat]}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Step 2: Define Daily Goal */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="goalInput" className="font-sans text-[12px] font-semibold uppercase tracking-wider text-[#1a1a1a]/50">
                    2. Define Your Daily Goal
                  </label>
                  <input
                    id="goalInput"
                    type="text"
                    required
                    maxLength={60}
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                    placeholder="e.g. Write 500 words, workout for 45 mins"
                    className="w-full p-3.5 rounded-xl bg-white/80 border border-black/10 focus:outline-none focus:border-[#0871E7] text-[13px] text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 font-sans transition-colors"
                  />
                  <span className="text-[10px] text-[#1a1a1a]/40 font-mono text-right mt-0.5">
                    {goalText.length}/60
                  </span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!selectedCategory || !goalText.trim()}
                  className="w-full py-3 rounded-full bg-[#0871E7] disabled:bg-[#0871E7]/50 text-white font-sans text-[14px] font-medium transition-all shadow-[inset_0_-4px_4px_rgba(255,255,255,0.39)] outline outline-1 outline-[#0871E7] -outline-offset-1 cursor-pointer disabled:cursor-not-allowed text-center"
                >
                  Link with Partner
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unified Info Explainer Modal (Philosophy, Trust, Access, Tribe) */}
      <InfoModal 
        isOpen={isInfoOpen} 
        onClose={() => setIsInfoOpen(false)} 
        activeTab={activeInfoTab}
        setActiveTab={setActiveInfoTab}
      />

      {/* Profile Stats Drawer Panel (Streaks, Totals, Calendar consistency map) */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        uid={uid || ""}
        userState={user || {} as any}
        onSignOut={handleSignOut}
      />
    </div>
  )
}
