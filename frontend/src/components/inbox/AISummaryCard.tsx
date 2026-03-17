import { motion } from "framer-motion"
import "./inbox.css"

export function AISummaryCard({ bullets }: { bullets: string[] }) {
  return (
    <div className="ai-summary">
      <div style={{ fontWeight: 600, marginBottom: 8 }}>AI Summary</div>
      <ul style={{ display: "grid", gap: 6, paddingLeft: 16 }}>
        {bullets.map((bullet, index) => (
          <motion.li
            key={bullet}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            {bullet}
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
