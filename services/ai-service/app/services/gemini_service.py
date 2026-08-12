import json
from typing import TypeVar

import httpx
from google import genai
from google.genai import errors, types
from pydantic import BaseModel, ValidationError

from app.config import Settings
from app.errors import AppError
from app.models import GenerateDeckRequest, GenerateDeckResponse, GenerateSlideRequest, Slide
from app.prompts.generate_deck import SYSTEM_PROMPT as DECK_SYSTEM_PROMPT, build_deck_prompt
from app.prompts.generate_slide import SYSTEM_PROMPT as SLIDE_SYSTEM_PROMPT, build_slide_prompt

T = TypeVar("T", bound=BaseModel)


class CandidateError(Exception):
    def __init__(self, message: str, candidate: object = None):
        super().__init__(message)
        self.candidate = candidate


class GeminiService:
    def __init__(self, settings: Settings, client: genai.Client | None = None):
        self.settings = settings
        self.client = client or (
            genai.Client(
                api_key=settings.gemini_api_key,
                http_options=types.HttpOptions(
                    timeout=60_000,
                    retry_options=types.HttpRetryOptions(attempts=1),
                ),
            )
            if settings.gemini_api_key
            else None
        )

    def generate_deck(self, request: GenerateDeckRequest) -> GenerateDeckResponse:
        return self._with_repair(DECK_SYSTEM_PROMPT, build_deck_prompt(request), GenerateDeckResponse,
                                 lambda result: self._validate_deck(result, request.slide_count))

    def generate_slide(self, request: GenerateSlideRequest) -> Slide:
        return self._with_repair(SLIDE_SYSTEM_PROMPT, build_slide_prompt(request), Slide,
                                 lambda result: self._validate_slide(result, request.slide_number))

    def _with_repair(self, system: str, prompt: str, schema: type[T], validator) -> T:
        try:
            candidate = self._request(system, prompt, schema)
            return validator(candidate)
        except CandidateError as first:
            invalid = self._safe_candidate(first.candidate)
            repair = ("Return a complete corrected object. Validation errors: " + str(first)[:1000] +
                      "\nInvalid candidate:\n" + invalid)
            try:
                candidate = self._request(system, repair, schema)
                return validator(candidate)
            except CandidateError as second:
                raise AppError(422, "VALIDATION_ERROR", "AI output failed validation after one repair attempt",
                               {"errors": [str(second)[:500]]}) from second

    def _request(self, system: str, prompt: str, schema: type[T]) -> T:
        if self.client is None:
            raise AppError(503, "AI_FAILURE", "Gemini is not configured or unavailable")
        try:
            response = self.client.models.generate_content(
                model=self.settings.llm_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system,
                    response_mime_type="application/json",
                    response_schema=schema,
                ),
            )
            parsed = getattr(response, "parsed", None)
            if parsed is None:
                content = getattr(response, "text", None)
                if not content:
                    raise AppError(503, "AI_FAILURE", "Gemini returned no usable output")
                try:
                    parsed = schema.model_validate_json(content)
                except (ValidationError, ValueError) as exc:
                    raise CandidateError(str(exc), content) from exc
            try:
                return schema.model_validate(parsed)
            except ValidationError as exc:
                raise CandidateError(str(exc), parsed) from exc
        except CandidateError:
            raise
        except (errors.APIError, httpx.TimeoutException, httpx.NetworkError, IndexError) as exc:
            raise AppError(503, "AI_FAILURE", "Gemini is unavailable or returned no usable output") from exc

    @staticmethod
    def _validate_deck(deck: GenerateDeckResponse, count: int) -> GenerateDeckResponse:
        errors = []
        if len(deck.slides) != count:
            errors.append(f"slides length must equal {count}")
        if [s.slide_number for s in deck.slides] != list(range(1, count + 1)):
            errors.append("slide numbers must be consecutive")
        for slide in deck.slides:
            if not 3 <= len(slide.key_points) <= 5:
                errors.append(f"slide {slide.slide_number} needs 3-5 key points")
            if not 2 <= len(slide.audience_questions) <= 3:
                errors.append(f"slide {slide.slide_number} needs 2-3 audience questions")
        if errors:
            raise CandidateError("; ".join(errors), deck)
        return deck

    @staticmethod
    def _validate_slide(slide: Slide, number: int) -> Slide:
        errors = []
        if slide.slide_number != number:
            errors.append(f"slide_number must equal {number}")
        if not 3 <= len(slide.key_points) <= 5:
            errors.append("slide needs 3-5 key points")
        if not 2 <= len(slide.audience_questions) <= 3:
            errors.append("slide needs 2-3 audience questions")
        if errors:
            raise CandidateError("; ".join(errors), slide)
        return slide

    @staticmethod
    def _safe_candidate(candidate: object) -> str:
        if isinstance(candidate, BaseModel):
            value = candidate.model_dump_json()
        elif isinstance(candidate, str):
            value = candidate
        else:
            value = json.dumps(candidate, default=str)
        return value[:12000]
