import { NextResponse } from "next/server";
type Context = { params: Promise<{ path: string[] }> };
async function forward(request: Request, context: Context) {
  const { path } = await context.params;
  const query = new URL(request.url).search;
  try {
    const response = await fetch(
      `${process.env.BACKEND_URL || "http://127.0.0.1:4000/api/v1"}/${path.map(encodeURIComponent).join("/")}${query}`,
      {
        method: request.method,
        headers: {
          "Content-Type": "application/json",
          ...(request.headers.get("authorization")
            ? { Authorization: request.headers.get("authorization")! }
            : {}),
        },
        ...(["GET", "HEAD"].includes(request.method)
          ? {}
          : { body: await request.text() }),
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
      },
    );
    return new Response(
      response.status === 204 ? null : await response.text(),
      {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BACKEND_UNAVAILABLE",
          message: "The backend is unavailable.",
        },
      },
      { status: 503 },
    );
  }
}
export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
