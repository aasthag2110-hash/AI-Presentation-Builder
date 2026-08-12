import { gatewayRequest } from "@/lib/api/client";
import type { UploadDocumentResponse } from "@/types/gateway";

export async function uploadDocument(file: File): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return gatewayRequest<UploadDocumentResponse>("/api/v1/documents/upload", {
    method: "POST",
    body: formData
  });
}
