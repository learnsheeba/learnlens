import logging

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .llm_service import generate_breakdown
from .media import build_media_bundle
from .schemas import BreakdownRequest, BreakdownResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="LearnLens API — Gemma 4 powered concept breakdowns",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "LearnLens API",
        "model": settings.gemma_model,
        "provider": settings.llm_provider,
        "multimodal": True,
        "status": "running",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/api/breakdown", response_model=BreakdownResponse)
async def create_breakdown_multimodal(
    concept: str = Form(""),
    image: UploadFile | None = File(None),
    audio: UploadFile | None = File(None),
    document: UploadFile | None = File(None),
):
    """Generate a breakdown from optional text plus image, audio, and/or document."""
    bundle = await build_media_bundle(concept, image, audio, document)

    try:
        data = await generate_breakdown(bundle)
        return BreakdownResponse(topic=bundle.topic_label(), data=data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Breakdown generation failed")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate breakdown. Check API key and model name.",
        ) from exc


@app.post("/api/breakdown/json", response_model=BreakdownResponse)
async def create_breakdown_json(body: BreakdownRequest):
    """Text-only breakdown (JSON body)."""
    concept = body.concept.strip()
    if not concept:
        raise HTTPException(status_code=400, detail="Concept cannot be empty")

    bundle = await build_media_bundle(concept, None, None, None)

    try:
        data = await generate_breakdown(bundle)
        return BreakdownResponse(topic=concept, data=data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Breakdown generation failed")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate breakdown. Check API key and model name.",
        ) from exc
