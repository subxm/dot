import { motion } from 'motion/react'

export function ProtocolSection() {
  const steps = [
    {
      num: "01",
      title: "Set Your Daily Slate",
      desc: "Authenticate with Google and define your single milestone in coding, fitness, writing, or mindfulness. Keep it concrete, under 60 characters."
    },
    {
      num: "02",
      title: "Silent Matching",
      desc: "Our matching engine links you with one anonymous partner working on the same daily discipline. No profiles, no comments, no chat spam."
    },
    {
      num: "03",
      title: "The Frosted Blur",
      desc: "Your partner's log is locked with a frosted blur. To unlock and read what they achieved today, you must write and submit your own check-in first."
    },
    {
      num: "04",
      title: "Fuel the Fire",
      desc: "If you both log progress within the 24-hour cycle, your streak grows. If either fails, the fire resets to zero. A silent bond of daily consistency."
    }
  ]

  const comparisons = [
    {
      title: "Traditional Tracking Apps",
      points: [
        "Infinite feeds, comments, and performative likes",
        "Gamification features that add anxiety and noise",
        "Social comparison and pressure to look perfect",
        "Intrusive push notifications that steal focus"
      ],
      isGood: false
    },
    {
      title: "The dot. Protocol",
      points: [
        "100% anonymous, safe space with zero direct chat",
        "Single daily check-in (maximum 280 characters)",
        "Reciprocal lock makes consistency a prerequisite",
        "One partner, one goal. Maximum silent support"
      ],
      isGood: true
    }
  ]

  return (
    <section className="relative w-full bg-[#F3F4ED] py-24 px-6 border-t border-black/5 flex flex-col items-center">
      {/* Title */}
      <div className="max-w-3xl text-center mb-16 select-none">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="font-sans text-[11px] font-bold text-[#0871E7] bg-[#0871E7]/10 px-3 py-1.5 rounded-full uppercase tracking-widest"
        >
          Product Validation
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.1 }}
          className="font-instrument text-[38px] md:text-[52px] leading-tight text-[#1a1a1a] tracking-tight mt-6"
        >
          The Protocol.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.2 }}
          className="font-sans text-[15px] md:text-[17px] text-[#1a1a1a]/70 leading-relaxed max-w-xl mx-auto mt-4"
        >
          A minimalist contract of accountability. By combining total anonymity with reciprocal locks, we eliminate performance anxiety while magnifying success.
        </motion.p>
      </div>

      {/* Steps Grid */}
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="group relative flex flex-col p-6 rounded-3xl bg-white/40 border border-black/5 hover:bg-white/70 hover:shadow-lg transition-all duration-500 text-left"
          >
            <span className="font-instrument text-[38px] italic font-bold text-[#0871E7]/30 group-hover:text-[#0871E7] transition-colors duration-500 leading-none mb-4">
              {step.num}
            </span>
            <h3 className="font-instrument text-[20px] font-bold text-[#1a1a1a] tracking-tight leading-snug mb-2">
              {step.title}
            </h3>
            <p className="font-sans text-[13px] text-[#1a1a1a]/70 leading-relaxed">
              {step.desc}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Validation / Comparison Section */}
      <div className="max-w-4xl w-full flex flex-col items-center">
        <div className="text-center mb-12 max-w-xl select-none">
          <motion.h3
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="font-instrument text-[28px] md:text-[36px] leading-tight text-[#1a1a1a] tracking-tight"
          >
            Why silence outperforms noise.
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-sans text-[13px] md:text-[14px] text-[#1a1a1a]/60 mt-3"
          >
            Studies show that sharing goals publicly in social media loops releases premature dopamine, reducing your drive. dot. is engineered for quiet output.
          </motion.p>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          {comparisons.map((c, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.98, x: idx === 0 ? -15 : 15 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className={`p-6 md:p-8 rounded-3xl border text-left flex flex-col justify-between ${
                c.isGood
                  ? "bg-[#0871E7]/5 border-[#0871E7]/25 shadow-md shadow-[#0871E7]/5"
                  : "bg-white/20 border-black/5"
              }`}
            >
              <div>
                <h4 className={`font-instrument text-[22px] font-bold mb-5 tracking-tight ${c.isGood ? 'text-[#0871E7]' : 'text-[#1a1a1a]'}`}>
                  {c.title}
                </h4>
                <ul className="flex flex-col gap-4">
                  {c.points.map((p, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-sans text-xs font-bold leading-none mt-0.5 ${
                        c.isGood 
                          ? 'bg-emerald-500/10 text-emerald-600' 
                          : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {c.isGood ? "✓" : "✗"}
                      </span>
                      <span className="font-sans text-[13px] text-[#1a1a1a]/75 leading-tight">
                        {p}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {c.isGood && (
                <div className="mt-8 p-4 bg-white/60 backdrop-blur rounded-2xl border border-black/5 text-[11px] font-mono text-[#1a1a1a]/60 leading-normal">
                  ✦ <strong> Reciprocity Rule:</strong> Your drive remains high because you cannot consume progress updates without creating yours first.
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
