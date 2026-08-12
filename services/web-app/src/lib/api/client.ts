import type { StandardApiError } from "@/types/gateway";

type ApiErrorCode = StandardApiError["error"]["code"];

const getGatewayUrl = () => {
  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL;

  if (!gatewayUrl) {
    throw new Error("NEXT_PUBLIC_GATEWAY_URL is not configured.");
  }

  return gatewayUrl.replace(/\/$/, "");
};

const isStandardApiError = (value: unknown): value is StandardApiError => {
  if (!value || typeof value !== "object" || !("error" in value)) {
    return false;
  }

  const { error } = value as { error: unknown };

  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      "message" in error &&
      "details" in error &&
      typeof error.code === "string" &&
      typeof error.message === "string"
  );
};

export class GatewayApiError extends Error {
  readonly code: ApiErrorCode;
  readonly details: Record<string, unknown>;
  readonly status: number;

  constructor(error: StandardApiError["error"], status: number) {
    super(error.message);
    this.name = "GatewayApiError";
    this.code = error.code;
    this.details = error.details;
    this.status = status;
  }
}

export async function gatewayRequest<TResponse>(
  path: string,
  init: RequestInit = {}
): Promise<TResponse> {
  const response = await fetch(`${getGatewayUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init.headers
    }
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);

    if (isStandardApiError(body)) {
      throw new GatewayApiError(body.error, response.status);
    }

    throw new GatewayApiError(
      {
        code: "INTERNAL_ERROR",
        message: `Gateway request failed with status ${response.status}.`,
        details: {}
      },
      response.status
    );
  }

  return (await response.json()) as TResponse;
}
