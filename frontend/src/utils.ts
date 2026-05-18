import type { BreakdownData } from "./types"

export function escapeHtml(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  )
}

export function breakdownToMarkdown(d: BreakdownData): string {
  return `# LearnLens Breakdown

## 💡 Simplified Explanation
${d.simplifiedExplanation}

## 🧱 Prerequisites
${d.prerequisites.map((p) => `- **${p.term}** — ${p.description}`).join("\n")}

## 🔑 Key Terms
${d.keyTerms.map((k) => `- **${k.term}**: ${k.definition}`).join("\n")}

## 🧩 Beginner Analogy
${d.beginnerAnalogy}

**Why this analogy works:** ${d.analogyExplanation}

## 🗺️ Learning Roadmap
${d.learningRoadmap.map((s) => `${s.step}. **${s.title}** (${s.estimatedTime}) — ${s.description}`).join("\n")}

## 🔥 Why It Matters
${d.whyItMatters.map((w) => `- **${w.title}**: ${w.reason}`).join("\n")}

## 🌍 Use Cases
${d.useCases.map((u) => `- **[${u.domain}] ${u.title}** — ${u.description}`).join("\n")}
`
}
