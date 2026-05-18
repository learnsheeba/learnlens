import { BreakdownCard } from "./BreakdownCard"
import type { BreakdownData, LayoutMode } from "../types"
import { SECTIONS } from "../types"

interface BreakdownOutputProps {
  data: BreakdownData
  layout: LayoutMode
  focusIdx: number
  onLayoutChange: (layout: LayoutMode) => void
  onFocusIdxChange: (idx: number) => void
  onExport: () => void
}

export function BreakdownOutput({
  data,
  layout,
  focusIdx,
  onLayoutChange,
  onFocusIdxChange,
  onExport,
}: BreakdownOutputProps) {
  const cards = SECTIONS.map((section, index) => (
    <BreakdownCard key={section.key} section={section} data={data} index={index} />
  ))

  return (
    <section className="output">
      <div className="output-header">
        <h2 className="output-title">Your breakdown</h2>
        <div className="layouts">
          {(
            [
              ["grid", "▦ Card Grid"],
              ["list", "≡ List View"],
              ["focus", "⬡ Focus Mode"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              className={`layout-btn${layout === mode ? " active" : ""}`}
              onClick={() => {
                onLayoutChange(mode)
                onFocusIdxChange(0)
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="export">
          <button type="button" onClick={onExport}>
            📋 Copy as Markdown
          </button>
        </div>
      </div>

      {layout === "grid" && <div className="layout-grid">{cards}</div>}
      {layout === "list" && <div className="layout-list">{cards}</div>}
      {layout === "focus" && (
        <div className="layout-focus">
          {cards[focusIdx]}
          <div className="focus-nav">
            <button
              type="button"
              disabled={focusIdx === 0}
              onClick={() => onFocusIdxChange(Math.max(0, focusIdx - 1))}
            >
              ← Prev
            </button>
            <div className="focus-dots">
              {cards.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`focus-dot${i === focusIdx ? " active" : ""}`}
                  onClick={() => onFocusIdxChange(i)}
                  aria-label={`Go to card ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={focusIdx === cards.length - 1}
              onClick={() => onFocusIdxChange(Math.min(cards.length - 1, focusIdx + 1))}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
