import io
from dataclasses import dataclass

from fastapi import HTTPException, UploadFile

IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
AUDIO_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/ogg",
    "audio/webm",
    "audio/flac",
    "audio/aac",
}
DOCUMENT_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_AUDIO_BYTES = 25 * 1024 * 1024
MAX_DOCUMENT_BYTES = 20 * 1024 * 1024


@dataclass
class MediaFile:
    filename: str
    mime_type: str
    data: bytes
    kind: str  # image | audio | document


@dataclass
class MediaBundle:
    concept: str
    image: MediaFile | None = None
    audio: MediaFile | None = None
    document: MediaFile | None = None

    @property
    def has_input(self) -> bool:
        return bool(self.concept.strip()) or any((self.image, self.audio, self.document))

    def topic_label(self) -> str:
        parts: list[str] = []
        if self.concept.strip():
            parts.append(self.concept.strip()[:80])
        for f in (self.image, self.audio, self.document):
            if f:
                parts.append(f.filename)
        return " · ".join(parts)[:120] or "Multimodal breakdown"


async def _read_upload(
    upload: UploadFile | None,
    *,
    allowed: set[str],
    max_bytes: int,
    kind: str,
) -> MediaFile | None:
    if upload is None or not upload.filename:
        return None

    mime = upload.content_type or "application/octet-stream"
    if mime == "audio/mp3":
        mime = "audio/mpeg"

    if mime not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported {kind} type: {mime}. Allowed: {', '.join(sorted(allowed))}",
        )

    data = await upload.read()
    if not data:
        raise HTTPException(status_code=400, detail=f"Empty {kind} file")
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"{kind.capitalize()} file too large (max {max_bytes // (1024 * 1024)} MB)",
        )

    return MediaFile(filename=upload.filename, mime_type=mime, data=data, kind=kind)


def extract_document_text(doc: MediaFile) -> str:
    if doc.mime_type in ("text/plain", "text/markdown"):
        return doc.data.decode("utf-8", errors="replace").strip()

    if doc.mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        try:
            from docx import Document
        except ImportError as exc:
            raise HTTPException(
                status_code=500,
                detail="DOCX support is not installed on the server",
            ) from exc
        document = Document(io.BytesIO(doc.data))
        return "\n".join(p.text for p in document.paragraphs if p.text.strip()).strip()

    if doc.mime_type == "application/pdf":
        try:
            from pypdf import PdfReader
        except ImportError as exc:
            raise HTTPException(
                status_code=500,
                detail="PDF text extraction is not installed on the server",
            ) from exc
        reader = PdfReader(io.BytesIO(doc.data))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(pages).strip()

    return ""


async def build_media_bundle(
    concept: str | None,
    image: UploadFile | None,
    audio: UploadFile | None,
    document: UploadFile | None,
) -> MediaBundle:
    bundle = MediaBundle(
        concept=(concept or "").strip(),
        image=await _read_upload(image, allowed=IMAGE_TYPES, max_bytes=MAX_IMAGE_BYTES, kind="image"),
        audio=await _read_upload(audio, allowed=AUDIO_TYPES, max_bytes=MAX_AUDIO_BYTES, kind="audio"),
        document=await _read_upload(
            document, allowed=DOCUMENT_TYPES, max_bytes=MAX_DOCUMENT_BYTES, kind="document"
        ),
    )

    if not bundle.has_input:
        raise HTTPException(
            status_code=400,
            detail="Provide text and/or at least one file (image, audio, or document)",
        )

    return bundle
