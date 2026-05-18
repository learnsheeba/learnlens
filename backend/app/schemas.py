from pydantic import BaseModel, Field


class Prerequisite(BaseModel):
    term: str
    description: str


class KeyTerm(BaseModel):
    term: str
    definition: str


class RoadmapStep(BaseModel):
    step: int
    title: str
    description: str
    estimatedTime: str


class WhyItMatters(BaseModel):
    title: str
    reason: str


class UseCase(BaseModel):
    domain: str
    title: str
    description: str


class BreakdownData(BaseModel):
    simplifiedExplanation: str
    prerequisites: list[Prerequisite]
    keyTerms: list[KeyTerm]
    beginnerAnalogy: str
    analogyExplanation: str
    learningRoadmap: list[RoadmapStep]
    whyItMatters: list[WhyItMatters]
    useCases: list[UseCase]


class BreakdownRequest(BaseModel):
    concept: str = Field(..., min_length=1, max_length=12000)


class BreakdownResponse(BaseModel):
    topic: str
    data: BreakdownData
