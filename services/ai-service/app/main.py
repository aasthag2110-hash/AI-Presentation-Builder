from fastapi import Depends, FastAPI
from fastapi.exceptions import RequestValidationError

from app.config import Settings, get_settings
from app.errors import AppError, app_error_handler, unexpected_error_handler, validation_error_handler
from app.models import GenerateDeckRequest, GenerateDeckResponse, GenerateSlideRequest, HealthResponse, Slide
from app.services.openai_service import OpenAIService

app = FastAPI(title="AI Presentation Generation Service")
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(Exception, unexpected_error_handler)


def get_ai_service(settings: Settings = Depends(get_settings)) -> OpenAIService:
    return OpenAIService(settings)


@app.get("/health", response_model=HealthResponse)
def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    return HealthResponse(status="ok", service="ai-service", model=settings.llm_model)


@app.post("/internal/ai/generate-deck", response_model=GenerateDeckResponse)
def generate_deck(request: GenerateDeckRequest, service: OpenAIService = Depends(get_ai_service)) -> GenerateDeckResponse:
    return service.generate_deck(request)


@app.post("/internal/ai/generate-slide", response_model=Slide)
def generate_slide(request: GenerateSlideRequest, service: OpenAIService = Depends(get_ai_service)) -> Slide:
    if request.slide_number > len(request.presentation_context.all_slide_titles):
        raise AppError(422, "VALIDATION_ERROR", "slide_number is outside the presentation title list")
    return service.generate_slide(request)
