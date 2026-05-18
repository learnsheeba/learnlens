import asyncio
import json
import re
from typing import Any

import httpx
from google import genai
from google.genai import types

from .config import get_settings
from .media import MediaBundle, extract_document_text
from .schemas import BreakdownData

BREAKDOWN_INSTRUCTION = """You are an expert educator. Analyze ALL material the user provided (written text and any attached image, audio, or document) and break it down into exactly 7 layers that help students understand it deeply.

Respond with a JSON object containing exactly these fields (no additional fields):
{{
  "simplifiedExplanation": "A 2-3 sentence plain-English explanation anyone could understand",
  "prerequisites": [
    {{"term": "concept name", "description": "what you need to know first"}}
  ],
  "keyTerms": [
    {{"term": "word", "definition": "clear definition"}}
  ],
  "beginnerAnalogy": "A detailed analogy that makes this concept relatable (2-3 sentences)",
  "analogyExplanation": "Why this analogy works (1-2 sentences)",
  "learningRoadmap": [
    {{"step": 1, "title": "Step name", "description": "What to learn", "estimatedTime": "~X days"}}
  ],
  "whyItMatters": [
    {{"title": "Impact area", "reason": "Why it's important"}}
  ],
  "useCases": [
    {{"domain": "Field/Industry", "title": "Application", "description": "How it's used"}}
  ]
}}

Include 4-5 prerequisites, 5-6 keyTerms, 5-6 learningRoadmap steps, 4 whyItMatters entries, and 5-6 useCases.
Base the breakdown on the actual content provided. Return only valid JSON."""


def _extract_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if "```json" in cleaned:
        cleaned = cleaned.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in cleaned:
        cleaned = cleaned.split("```", 1)[1].split("```", 1)[0].strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if not match:
            raise ValueError("Model response did not contain valid JSON") from None
        return json.loads(match.group(0))


def _build_text_context(bundle: MediaBundle) -> str:
    sections: list[str] = []

    if bundle.concept:
        sections.append(f"User text:\n{bundle.concept}")

    if bundle.document:
        if bundle.document.mime_type == "application/pdf":
            sections.append(
                f"Document attached: {bundle.document.filename} (PDF — analyze the PDF content provided)"
            )
        else:
            doc_text = extract_document_text(bundle.document)
            if doc_text:
                sections.append(f"Document ({bundle.document.filename}):\n{doc_text}")

    if bundle.image:
        sections.append(f"Image attached: {bundle.image.filename} (analyze the image content provided)")

    if bundle.audio:
        sections.append(
            f"Audio attached: {bundle.audio.filename} (listen to the audio and use its content)"
        )

    return "\n\n".join(sections)


def _build_google_parts(bundle: MediaBundle) -> list[types.Part]:
    parts: list[types.Part] = [types.Part.from_text(text=BREAKDOWN_INSTRUCTION)]

    context = _build_text_context(bundle)
    if context:
        parts.append(types.Part.from_text(text=context))

    if bundle.image:
        parts.append(
            types.Part.from_bytes(data=bundle.image.data, mime_type=bundle.image.mime_type)
        )

    if bundle.audio:
        parts.append(
            types.Part.from_bytes(data=bundle.audio.data, mime_type=bundle.audio.mime_type)
        )

    if bundle.document and bundle.document.mime_type == "application/pdf":
        parts.append(
            types.Part.from_bytes(
                data=bundle.document.data,
                mime_type="application/pdf",
            )
        )

    return parts


def _generate_with_google(bundle: MediaBundle) -> BreakdownData:
    settings = get_settings()
    if not settings.google_api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY is not set. Add your Google AI Studio key to backend/.env"
        )

    client = genai.Client(api_key=settings.google_api_key)
    parts = _build_google_parts(bundle)

    response = client.models.generate_content(
        model=settings.gemma_model,
        contents=parts,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.7,
        ),
    )

    text = response.text or ""
    payload = _extract_json(text)
    return BreakdownData.model_validate(payload)


def _build_ollama_prompt(bundle: MediaBundle) -> str:
    context = _build_text_context(bundle)
    note_parts: list[str] = []

    if bundle.image or bundle.audio:
        note_parts.append(
            "Image/audio were attached but Ollama cannot process them here — only extracted text is used."
        )

    if bundle.document and bundle.document.mime_type == "application/pdf":
        pdf_text = extract_document_text(bundle.document)
        if pdf_text:
            context = f"{context}\n\nDocument ({bundle.document.filename}):\n{pdf_text}".strip()
        else:
            note_parts.append("PDF text extraction yielded little content.")

    note = f"\n\nNote: {' '.join(note_parts)}" if note_parts else ""
    return f"{BREAKDOWN_INSTRUCTION}\n\n{context}{note}".strip()


async def _generate_with_ollama(bundle: MediaBundle) -> BreakdownData:
    settings = get_settings()
    prompt = _build_ollama_prompt(bundle)

    async with httpx.AsyncClient(timeout=180.0) as client:
        res = await client.post(
            f"{settings.ollama_base_url.rstrip('/')}/api/chat",
            json={
                "model": settings.ollama_model,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "format": "json",
            },
        )
        res.raise_for_status()
        data = res.json()

    text = data.get("message", {}).get("content", "")
    payload = _extract_json(text)
    return BreakdownData.model_validate(payload)


async def generate_breakdown(bundle: MediaBundle) -> BreakdownData:
    settings = get_settings()

    if settings.llm_provider.lower() == "ollama":
        return await _generate_with_ollama(bundle)

    return await asyncio.to_thread(_generate_with_google, bundle)
