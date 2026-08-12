/** Gateway API contracts. These types intentionally preserve backend snake_case fields. */

export type Tone = "professional" | "casual" | "academic" | "persuasive";

export type PresentationSource = "prompt" | "document";

export type PresentationStatus = "draft" | "final";

export type VisualRecommendationType = "chart" | "image" | "diagram" | "icon" | "quote";

export interface VisualRecommendation {
  type: VisualRecommendationType;
  description: string;
  search_keywords: string[];
}

export interface AudienceQuestion {
  question: string;
  suggested_answer: string;
}

export interface Slide {
  slide_number: number;
  title: string;
  key_points: string[];
  speaker_notes: string;
  visual_recommendation: VisualRecommendation;
  audience_questions: AudienceQuestion[];
}

export interface Presentation {
  presentation_id: string;
  title: string;
  summary: string;
  estimated_duration_minutes: number;
  source: PresentationSource;
  audience: string;
  tone: Tone;
  slide_count: number;
  status: PresentationStatus;
  slides: Slide[];
  created_at: string;
  updated_at: string;
}

export interface GeneratePromptRequest {
  source: "prompt";
  topic: string;
  audience: string;
  tone: Tone;
  slide_count: number;
}

export interface GenerateDocumentRequest {
  source: "document";
  document_id: string;
  audience: string;
  tone: Tone;
  slide_count: number;
}

export interface UpdateSlideRequest {
  title: string;
  key_points: string[];
  speaker_notes: string;
}

export interface RegenerateSlideRequest {
  instructions?: string;
}

export interface UploadDocumentResponse {
  document_id: string;
  filename: string;
  extracted_text_preview: string;
  char_count: number;
}

export interface StandardApiError {
  error: {
    code: "VALIDATION_ERROR" | "NOT_FOUND" | "AI_FAILURE" | "INTERNAL_ERROR";
    message: string;
    details: Record<string, unknown>;
  };
}
