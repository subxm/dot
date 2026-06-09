import { motion, AnimatePresence } from 'motion/react'

export type InfoTab = 'philosophy' | 'trust' | 'access' | 'tribe';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: InfoTab;
  setActiveTab: (tab: InfoTab) => void;
}

export function InfoModal({ isOpen, onClose, activeTab, setActiveTab }: InfoModalProps) {
  const tabs: { id: InfoTab; label: string }[] = [
    { id: 'philosophy', label: 'Philosophy' },
    { id: 'trust', label: 'Trust & Privacy' },
    { id: 'access', label: 'Access & Flow' },
    { id: 'tribe', label: 'Tribe matching' }
  ]

  const getTabTitle = () => {
    if (activeTab === 'philosophy') return "Why dot. ?"
    if (activeTab === 'trust') return "Anonymity & Safety"
    if (activeTab === 'access') return "System Mechanics"
    return "Tribe Fellowship"
  }

  const getTabSubtitle = () => {
    if (activeTab === 'philosophy') {
      return "Habits are 92% more likely to succeed with accountability. But noisy group chats and complex tracking apps add friction. dot. links you with a single, silent partner sharing your goal. No chatter, just daily progress."
    }
    if (activeTab === 'trust') {
      return "Safety is built by design. By removing chat and profile exposure, dot. creates a pure, distraction-free environment for raw progress."
    }
    if (activeTab === 'access') {
      return "Dot works on a daily reciprocal cycle. Your daily log is the key to unlocking your partner's logs, maintaining a continuous chain of support."
    }
    return "We group accountability partners into structured categories. Work alongside someone pursuing the same daily discipline."
  }

  // Principles / Cards for each tab
  const getTabContent = () => {
    if (activeTab === 'philosophy') {
      return [
        {
          title: "Shared Focus",
          desc: "Select coding, fitness, writing, or mindfulness. You are paired with one partner focusing on the same habit."
        },
        {
          title: "Daily Check-in",
          desc: "Log your progress note (max 280 chars) once a day. Share what you achieved to keep your word."
        },
        {
          title: "Reciprocal Swap",
          desc: "Your partner's progress note stays blurred until you submit yours. Action inspires action."
        },
        {
          title: "Shared Streak",
          desc: "When you both check in daily, your streak fire grows. Build consistency in silent support."
        }
      ]
    }
    if (activeTab === 'trust') {
      return [
        {
          title: "100% Anonymous",
          desc: "Your email, name, and profile photo are never shared with your partner. You are matched purely by goal description."
        },
        {
          title: "Zero Direct Messaging",
          desc: "There are no direct messages, replies, likes, or comments. This eliminates toxicity, spam, and performance anxiety."
        },
        {
          title: "Google Verified",
          desc: "Google Authentication is used solely to verify unique human users, keeping the platform clean of bots and fake accounts."
        },
        {
          title: "Clean Severing",
          desc: "If your partner stops contributing, you can sever the link and rejoin matchmaking. No hard feelings, no awkward exits."
        }
      ]
    }
    if (activeTab === 'access') {
      return [
        {
          title: "The Frosted Blur",
          desc: "Reciprocal transparency. Your partner's daily entry is blurred until your own daily check-in is complete."
        },
        {
          title: "Midnight Reset",
          desc: "At UTC midnight, the daily slate resets. You have 24 hours to post your check-in or the streak fire resets to zero."
        },
        {
          title: "Direct Access",
          desc: "Log in securely with Google. No passwords or registration required. Your status determines what you see."
        },
        {
          title: "Matchmaking Cycle",
          desc: "Join matching to find a partner. Once matched, the active log replaces the search layout automatically."
        }
      ]
    }
    // tribe
    return [
      {
        title: "💻 Coding Tribe",
        desc: "For software engineers and builders committing code, practicing algorithms, or shipping side-projects."
      },
      {
        title: "🏋️ Fitness Tribe",
        desc: "For athletes, runners, and weightlifters completing workouts, steps, runs, or stretching routines."
      },
      {
        title: "✍️ Writing Tribe",
        desc: "For novelists, bloggers, and copywriters drafting pages, scripts, articles, or editing word counts."
      },
      {
        title: "🧘 Mindfulness Tribe",
        desc: "For practitioners meditating, journaling, practicing breathing exercises, or logging gratitude logs."
      }
    ]
  }

  const items = getTabContent()

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl bg-[#F3F4ED]/95 border border-black/10 p-6 md:p-8 shadow-2xl text-left pointer-events-auto flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer text-[#1a1a1a]/70 hover:text-[#1a1a1a]"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation Tabs */}
            <div className="flex border-b border-black/15 pb-2 mb-6 overflow-x-auto gap-2 md:gap-4 no-scrollbar">
              {tabs.map((tab) => {
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`font-sans text-[12px] md:text-[13px] font-medium py-1.5 px-3 rounded-full transition-all cursor-pointer whitespace-nowrap border ${
                      active 
                        ? "text-white bg-[#0871E7] border-[#0871E7]" 
                        : "text-[#1a1a1a]/60 hover:text-[#1a1a1a] bg-transparent border-transparent hover:bg-black/5"
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Modal Content */}
            <div className="flex flex-col flex-1 min-h-[300px]">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col flex-1"
              >
                <h2 className="font-instrument text-[28px] md:text-[34px] leading-tight text-[#1a1a1a] tracking-tight mb-2">
                  {getTabTitle()}
                </h2>
                <p className="font-sans text-[13px] md:text-[14px] text-[#1a1a1a]/75 mb-6 leading-relaxed">
                  {getTabSubtitle()}
                </p>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 flex-1">
                  {items.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white/40 border border-black/5 hover:bg-white/60 transition-colors"
                    >
                      <h3 className="font-instrument text-[18px] md:text-[20px] font-bold text-[#1a1a1a] tracking-tight leading-none">
                        {item.title}
                      </h3>
                      <p className="font-sans text-[12px] md:text-[13px] text-[#1a1a1a]/70 leading-relaxed font-normal">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Footer CTA */}
              <button
                onClick={onClose}
                className="mt-6 md:mt-8 w-full py-3 rounded-full bg-[#0871E7] hover:brightness-105 active:scale-[0.99] text-white font-sans text-[14px] font-medium transition-all shadow-[inset_0_-4px_4px_rgba(255,255,255,0.39)] outline outline-1 outline-[#0871E7] -outline-offset-1 cursor-pointer text-center"
              >
                Return to Focus
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
