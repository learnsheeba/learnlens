import { useEffect, useRef } from "react"
import type { HistoryItem } from "../types"

interface TopbarProps {
  dark: boolean
  history: HistoryItem[]
  historyOpen: boolean
  onToggleTheme: () => void
  onToggleHistory: () => void
  onCloseHistory: () => void
  onSelectHistory: (item: HistoryItem) => void
}

export function Topbar({
  dark,
  history,
  historyOpen,
  onToggleTheme,
  onToggleHistory,
  onCloseHistory,
  onSelectHistory,
}: TopbarProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!historyOpen) return
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        onCloseHistory()
      }
    }
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [historyOpen, onCloseHistory])

  return (
    <header className="topbar">
      <div className="logo">
        <div className="logo-mark">L</div>
        LearnLens
      </div>
      <div className="top-actions">
        <div style={{ position: "relative" }} ref={menuRef}>
          <button type="button" className="icon-btn" title="History" onClick={onToggleHistory}>
            🕘
          </button>
          {historyOpen && (
            <div className="history-menu">
              {history.length === 0 ? (
                <div className="history-empty">No saved topics yet</div>
              ) : (
                history.map((h, i) => (
                  <button
                    key={`${h.ts}-${i}`}
                    type="button"
                    className="history-item"
                    onClick={() => onSelectHistory(h)}
                  >
                    <span>
                      {h.topic.slice(0, 60)}
                      {h.topic.length > 60 ? "…" : ""}
                    </span>
                    <small>{new Date(h.ts).toLocaleString()}</small>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <button type="button" className="icon-btn" title="Toggle theme" onClick={onToggleTheme}>
          {dark ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  )
}
