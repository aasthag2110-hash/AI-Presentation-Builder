from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Tone(str, Enum):
    professional = "professional"
    casual = "casual"
    academic = "academic"
    persuasive = "persuasive"


class Source(str, Enum):
    prompt = "prompt"
    document = "document"


NonEmpty = str


class VisualRecommendation(StrictModel):
    type: str = Field(pattern=r"^(chart|image|diagram|icon|quote)$")
    description: str = Field(min_length=1, max_length=500)
    search_keywords: list[str] = Field(min_length=1, max_length=5)

    @field_validator("description")
    @classmethod
    def nonblank_description(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value

    @field_validator("search_keywords")
    @classmethod
    def nonblank_keywords(cls, value: list[str]) -> list[str]:
        if any(not item.strip() for item in value):
            raise ValueError("keywords must not be blank")
        return value


class AudienceQuestion(StrictModel):
    question: str = Field(min_length=1)
    suggested_answer: str = Field(min_length=1)

    @field_validator("question", "suggested_answer")
    @classmethod
    def nonblank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value


class Slide(StrictModel):
    slide_number: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=200)
    key_points: list[str] = Field(min_length=1, max_length=5)
    speaker_notes: str = Field(min_length=1, max_length=2000)
    visual_recommendation: VisualRecommendation
    audience_questions: list[AudienceQuestion]

    @field_validator("title", "speaker_notes")
    @classmethod
    def nonblank_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value

    @field_validator("key_points")
    @classmethod
    def nonblank_points(cls, value: list[str]) -> list[str]:
        if any(not item.strip() for item in value):
            raise ValueError("key points must not be blank")
        return value


class GenerateDeckRequest(StrictModel):
    topic: str = Field(min_length=1)
    audience: str = Field(min_length=1)
    tone: Tone
    slide_count: int = Field(ge=5, le=10)
    source: Source

    @field_validator("topic", "audience")
    @classmethod
    def nonblank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value


class GenerateDeckResponse(StrictModel):
    title: str
    summary: str
    estimated_duration_minutes: int
    slides: list[Slide]


class PresentationContext(StrictModel):
    title: str = Field(min_length=1)
    audience: str = Field(min_length=1)
    tone: Tone
    all_slide_titles: list[str] = Field(min_length=1)

    @field_validator("title", "audience")
    @classmethod
    def nonblank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value

    @field_validator("all_slide_titles")
    @classmethod
    def nonblank_titles(cls, value: list[str]) -> list[str]:
        if any(not title.strip() for title in value):
            raise ValueError("slide titles must not be blank")
        return value


class GenerateSlideRequest(StrictModel):
    presentation_context: PresentationContext
    slide_number: int = Field(ge=1)
    current_slide: Slide | None = None
    instructions: str | None = Field(default=None, max_length=500)


class HealthResponse(StrictModel):
    status: str
    service: str
    model: str
