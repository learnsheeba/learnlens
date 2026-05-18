import { useCallback, useEffect, useRef, useState } from "react"
import { fetchBreakdown } from "./api"
import { BreakdownOutput } from "./components/BreakdownOutput"
import { LoadingState } from "./components/LoadingState"
import { MediaUpload } from "./components/MediaUpload"
import { Topbar } from "./components/Topbar"
import type { BreakdownData, HistoryItem, LayoutMode, MediaFiles } from "./types"
import { EMPTY_MEDIA, LOADING_MSGS, SAMPLE, hasAnyInput } from "./types"
import { breakdownToMarkdown } from "./utils"

const HISTORY_KEY = "ll_history"
const DARK_KEY = "ll_dark"

function loadHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")
  } catch {
    return []
  }
}

function saveHistory(topic: string, data: BreakdownData) {
  const item: HistoryItem = { topic: topic.slice(0, 80), data, ts: Date.now() }
  const history = [item, ...loadHistory().filter((h) => h.topic !== item.topic)].slice(0, 5)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  return history
}

export default function App() {
  const [input, setInput] = useState("")
  const [media, setMedia] = useState<MediaFiles>(EMPTY_MEDIA)
  const [dark, setDark] = useState(() => localStorage.getItem(DARK_KEY) === "1")
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0])
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<BreakdownData | null>(null)
  const [layout, setLayout] = useState<LayoutMode>("grid")
  const [focusIdx, setFocusIdx] = useState(0)
  const outputRef = useRef<HTMLDivElement>(null)

  const canSubmit = hasAnyInput(input, media) && !loading

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem(DARK_KEY, dark ? "1" : "0")
  }, [dark])

  useEffect(() => {
    if (!loading) return
    let i = 0
    const timer = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length
      setLoadingMsg(LOADING_MSGS[i])
    }, 1400)
    return () => clearInterval(timer)
  }, [loading])

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return

    setError(null)
    setLoading(true)
    setData(null)

    try {
      const result = await fetchBreakdown(input, media)
      setData(result.data)
      setHistory(saveHistory(result.topic, result.data))
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [input, media, canSubmit])

  const handleSelectHistory = (item: HistoryItem) => {
    setInput(item.topic)
    setMedia(EMPTY_MEDIA)
    setData(item.data)
    setHistoryOpen(false)
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80)
  }

  const handleExport = () => {
    if (!data) return
    const blob = new Blob([breakdownToMarkdown(data)], { type: "text/markdown" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "learnlens-breakdown.md"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <Topbar
        dark={dark}
        history={history}
        historyOpen={historyOpen}
        onToggleTheme={() => setDark((d) => !d)}
        onToggleHistory={() => setHistoryOpen((o) => !o)}
        onCloseHistory={() => setHistoryOpen(false)}
        onSelectHistory={handleSelectHistory}
      />

      <section className="hero">
        <div className="hero-inner">
          <span className="eyebrow">✦ A learning lens for curious minds</span>
          <h1>Turn any concept into crystal-clear understanding</h1>
          <p>
            Paste text, upload an image, audio, or document — or combine them. LearnLens breaks
            your material into the seven layers your brain actually needs.
          </p>
          {error && <div className="error-banner">{error}</div>}
          <div className="input-wrap">
            <textarea
              className="ta"
              placeholder="Paste any concept, paragraph, or topic here (optional if you attach files)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <MediaUpload media={media} onChange={setMedia} disabled={loading} />
            <div className="input-footer">
              <div className="meta">
                <span>{input.length} characters</span>
                {input.length > 0 && (
                  <button
                    type="button"
                    className="link"
                    onClick={() => setInput("")}
                    title="Clear text"
                  >
                    Clear
                  </button>
                )}
                <button type="button" className="link" onClick={() => setInput(SAMPLE)}>
                  Try an example →
                </button>
              </div>
              <button type="button" className="cta" disabled={!canSubmit} onClick={handleSubmit}>
                {loading ? "Decoding…" : "✦ Break It Down"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {loading && <LoadingState message={loadingMsg} />}

      {data && !loading && (
        <div ref={outputRef}>
          <BreakdownOutput
            data={data}
            layout={layout}
            focusIdx={focusIdx}
            onLayoutChange={setLayout}
            onFocusIdxChange={setFocusIdx}
            onExport={handleExport}
          />
        </div>
      )}

      <footer>
        <strong>LearnLens</strong> — Every concept, decoded.
      </footer>
    </>
  )
}
