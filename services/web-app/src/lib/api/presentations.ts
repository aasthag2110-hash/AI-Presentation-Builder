import { gatewayRequest } from "@/lib/api/client";
import type {
  GenerateDocumentRequest,
  GeneratePromptRequest,
  Presentation,
  RegenerateSlideRequest,
  Slide,
  UpdateSlideRequest
} from "@/types/gateway";

export type GeneratePresentationRequest = GeneratePromptRequest | GenerateDocumentRequest;

const jsonRequest = (method: "POST" | "PATCH", body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
});

export function generatePresentation(data: GeneratePresentationRequest): Promise<Presentation> {
  return gatewayRequest<Presentation>(
    "/api/v1/presentations/generate",
    jsonRequest("POST", data)
  );
}

export function getPresentation(presentationId: string): Promise<Presentation> {
  return gatewayRequest<Presentation>(`/api/v1/presentations/${presentationId}`);
}

export function updateSlide(
  presentationId: string,
  slideNumber: number,
  data: UpdateSlideRequest
): Promise<Slide> {
  return gatewayRequest<Slide>(
    `/api/v1/presentations/${presentationId}/slides/${slideNumber}`,
    jsonRequest("PATCH", data)
  );
}

export function regenerateSlide(
  presentationId: string,
  slideNumber: number,
  instructions?: string
): Promise<Slide> {
  const data: RegenerateSlideRequest | undefined = instructions ? { instructions } : undefined;

  return gatewayRequest<Slide>(
    `/api/v1/presentations/${presentationId}/slides/${slideNumber}/regenerate`,
    data ? jsonRequest("POST", data) : { method: "POST" }
  );
}
