export interface Prerequisite {
  term: string
  description: string
}

export interface KeyTerm {
  term: string
  definition: string
}

export interface RoadmapStep {
  step: number
  title: string
  description: string
  estimatedTime: string
}

export interface WhyItMatters {
  title: string
  reason: string
}

export interface UseCase {
  domain: string
  title: string
  description: string
}

export interface BreakdownData {
  simplifiedExplanation: string
  prerequisites: Prerequisite[]
  keyTerms: KeyTerm[]
  beginnerAnalogy: string
  analogyExplanation: string
  learningRoadmap: RoadmapStep[]
  whyItMatters: WhyItMatters[]
  useCases: UseCase[]
}

export interface HistoryItem {
  topic: string
  data: BreakdownData
  ts: number
}

export interface MediaFiles {
  image: File | null
  audio: File | null
  document: File | null
}

export const EMPTY_MEDIA: MediaFiles = { image: null, audio: null, document: null }

export type LayoutMode = "grid" | "list" | "focus"

export const SAMPLE =
  "Neural networks are computational models inspired by the human brain. They consist of layers of interconnected nodes (neurons) that process input data and learn patterns through a training process. By adjusting the weights of connections between neurons, neural networks can recognize images, understand language, and make predictions across countless domains."

export const LOADING_MSGS = [
  "Decoding the knowledge atoms…",
  "Untangling the concept threads…",
  "Mapping ideas to neurons…",
  "Building your learning lens…",
  "Listening to your audio…",
  "Reading your document…",
  "Scanning your image…",
]

export const SECTIONS = [
  { key: "simplifiedExplanation" as const, title: "Simplified Explanation", icon: "💡", accent: "var(--indigo)" },
  { key: "prerequisites" as const, title: "Prerequisites", icon: "🧱", accent: "var(--amber)" },
  { key: "keyTerms" as const, title: "Key Terms", icon: "🔑", accent: "var(--teal)" },
  { key: "beginnerAnalogy" as const, title: "Beginner Analogy", icon: "🧩", accent: "var(--purple)" },
  { key: "learningRoadmap" as const, title: "Learning Roadmap", icon: "🗺️", accent: "var(--rose)" },
  { key: "whyItMatters" as const, title: "Why It Matters", icon: "🔥", accent: "var(--orange)" },
  { key: "useCases" as const, title: "Use Cases", icon: "🌍", accent: "var(--emerald)" },
]

export function hasMedia(media: MediaFiles): boolean {
  return !!(media.image || media.audio || media.document)
}

export function hasAnyInput(concept: string, media: MediaFiles): boolean {
  return !!concept.trim() || hasMedia(media)
}
