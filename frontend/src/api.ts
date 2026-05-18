import type { BreakdownData, MediaFiles } from "./types"

const API_BASE = import.meta.env.VITE_API_URL ?? ""

export async function fetchBreakdown(
  concept: string,
  media: MediaFiles,
): Promise<{ topic: string; data: BreakdownData }> {
  const form = new FormData()
  form.append("concept", concept.trim())
  if (media.image) form.append("image", media.image, media.image.name)
  if (media.audio) form.append("audio", media.audio, media.audio.name)
  if (media.document) form.append("document", media.document, media.document.name)

  const res = await fetch(`${API_BASE}/api/breakdown`, {
    method: "POST",
    body: form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    const detail = err.detail
    throw new Error(
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg).join(", ")
          : "Failed to generate breakdown",
    )
  }

  return res.json()
}
