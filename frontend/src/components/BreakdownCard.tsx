import type { CSSProperties } from "react"
import type { BreakdownData } from "../types"
import { SECTIONS } from "../types"

type SectionKey = (typeof SECTIONS)[number]["key"]

function CardBody({ sectionKey, data }: { sectionKey: SectionKey; data: BreakdownData }) {
  switch (sectionKey) {
    case "simplifiedExplanation":
      return <p>{data.simplifiedExplanation}</p>
    case "prerequisites":
      return (
        <ul className="list">
          {data.prerequisites.map((p) => (
            <li key={p.term}>
              <span className="term">{p.term}</span> — {p.description}
            </li>
          ))}
        </ul>
      )
    case "keyTerms":
      return (
        <div className="glossary">
          {data.keyTerms.map((k) => (
            <div className="glossary-row" key={k.term}>
              <span className="term">{k.term}</span>
              <span>{k.definition}</span>
            </div>
          ))}
        </div>
      )
    case "beginnerAnalogy":
      return (
        <>
          <p>{data.beginnerAnalogy}</p>
          <div className="analogy-note">
            <strong>Why this analogy works:</strong> {data.analogyExplanation}
          </div>
        </>
      )
    case "learningRoadmap":
      return (
        <div className="timeline">
          {data.learningRoadmap.map((s) => (
            <div className="step" key={s.step}>
              <div className="step-num">{s.step}</div>
              <div>
                <div className="step-title">{s.title}</div>
                <div>{s.description}</div>
                <div className="step-meta">⏱ {s.estimatedTime}</div>
              </div>
            </div>
          ))}
        </div>
      )
    case "whyItMatters":
      return (
        <div className="reasons">
          {data.whyItMatters.map((w) => (
            <div key={w.title}>
              <div className="reason-title">{w.title}</div>
              <div>{w.reason}</div>
            </div>
          ))}
        </div>
      )
    case "useCases":
      return (
        <div className="usecases">
          {data.useCases.map((u) => (
            <div key={u.title}>
              <span className="badge">{u.domain}</span>
              <div className="reason-title">{u.title}</div>
              <div>{u.description}</div>
            </div>
          ))}
        </div>
      )
    default:
      return null
  }
}

export function BreakdownCard({
  section,
  data,
  index,
}: {
  section: (typeof SECTIONS)[number]
  data: BreakdownData
  index: number
}) {
  return (
    <article
      className="card"
      style={
        {
          "--accent": section.accent,
          animationDelay: `${index * 80}ms`,
        } as CSSProperties
      }
    >
      <div className="card-head">
        <div className="card-icon">{section.icon}</div>
        <h3 className="card-title">{section.title}</h3>
      </div>
      <div className="card-body">
        <CardBody sectionKey={section.key} data={data} />
      </div>
    </article>
  )
}
