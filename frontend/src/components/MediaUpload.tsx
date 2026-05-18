import { useEffect, useRef, useState } from "react"
import type { MediaFiles } from "../types"

const ACCEPT = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  audio: "audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/flac,audio/mp4,audio/aac",
  document:
    ".pdf,.txt,.md,.docx,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const

const SLOTS = [
  {
    key: "image" as const,
    icon: "🖼️",
    label: "Image",
    tooltip: "Upload an image (JPG, PNG, WebP, GIF). The model analyzes visual content.",
  },
  {
    key: "audio" as const,
    icon: "🎧",
    label: "Audio",
    tooltip: "Upload audio (MP3, WAV, OGG, WebM, FLAC). The model listens and summarizes.",
  },
  {
    key: "document" as const,
    icon: "📄",
    label: "Document",
    tooltip: "Upload a document (PDF, TXT, MD, DOCX). The model reads and breaks it down.",
  },
]

interface MediaUploadProps {
  media: MediaFiles
  onChange: (media: MediaFiles) => void
  disabled?: boolean
}

export function MediaUpload({ media, onChange, disabled }: MediaUploadProps) {
  const imageRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLInputElement>(null)
  const documentRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const inputRefs = { image: imageRef, audio: audioRef, document: documentRef }

  useEffect(() => {
    if (!media.image) {
      setImagePreview(null)
      return
    }
    const url = URL.createObjectURL(media.image)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [media.image])

  const setFile = (key: keyof MediaFiles, file: File | null) => {
    onChange({ ...media, [key]: file })
  }

  const clear = (key: keyof MediaFiles) => {
    setFile(key, null)
    if (inputRefs[key].current) inputRefs[key].current!.value = ""
  }

  return (
    <div className="media-upload">
      {/* <span className="media-label">Optional</span> */}
      <div className="media-actions">
        {SLOTS.map((slot) => (
          <UploadSlot
            key={slot.key}
            icon={slot.icon}
            label={slot.label}
            tooltip={
              media[slot.key]
                ? `${media[slot.key]!.name} — click × to remove`
                : slot.tooltip
            }
            file={media[slot.key]}
            previewUrl={slot.key === "image" ? imagePreview : null}
            disabled={disabled}
            onPick={() => inputRefs[slot.key].current?.click()}
            onClear={() => clear(slot.key)}
          />
        ))}
      </div>
      <input
        ref={imageRef}
        type="file"
        accept={ACCEPT.image}
        hidden
        disabled={disabled}
        onChange={(e) => setFile("image", e.target.files?.[0] ?? null)}
      />
      <input
        ref={audioRef}
        type="file"
        accept={ACCEPT.audio}
        hidden
        disabled={disabled}
        onChange={(e) => setFile("audio", e.target.files?.[0] ?? null)}
      />
      <input
        ref={documentRef}
        type="file"
        accept={ACCEPT.document}
        hidden
        disabled={disabled}
        onChange={(e) => setFile("document", e.target.files?.[0] ?? null)}
      />
    </div>
  )
}

function UploadSlot({
  icon,
  label,
  tooltip,
  file,
  previewUrl,
  disabled,
  onPick,
  onClear,
}: {
  icon: string
  label: string
  tooltip: string
  file: File | null
  previewUrl: string | null
  disabled?: boolean
  onPick: () => void
  onClear: () => void
}) {
  return (
    <div className={`media-slot${file ? " has-file" : ""}`}>
      <button
        type="button"
        className="media-thumb"
        disabled={disabled}
        onClick={onPick}
        title={tooltip}
        aria-label={file ? `${label}: ${file.name}` : `${label}. ${tooltip}`}
        data-tooltip={tooltip}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="media-thumb-img" />
        ) : (
          <span className="media-thumb-icon" aria-hidden>
            {icon}
          </span>
        )}
      </button>
      {file && (
        <button
          type="button"
          className="media-clear"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation()
            onClear()
          }}
          title={`Remove ${label}`}
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      )}
    </div>
  )
}
