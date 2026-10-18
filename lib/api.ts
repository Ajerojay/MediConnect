import "server-only";
import { cookies } from "next/headers";
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const token = authenticated
    ? (await cookies()).get("mediconnect_session")?.value
    : undefined;
  let response: Response;
  try {
    response = await fetch(
      `${process.env.BACKEND_URL || "http://127.0.0.1:4000/api/v1"}${path}`,
      {
        ...init,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...init.headers,
        },
      },
    );
  } catch {
    throw new ApiError(
      503,
      "The backend is unavailable. Start the application with npm run dev.",
    );
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json();
  if (!response.ok)
    throw new ApiError(
      response.status,
      body.error?.message || "The request could not be completed.",
    );
  return body.data as T;
}
