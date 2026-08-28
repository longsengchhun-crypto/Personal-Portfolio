import { NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

const PUSH_INTERVAL_MS = 4_000;
const MAX_STREAM_MS = 50_000; // stay under typical serverless duration limits; EventSource auto-reconnects.

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const safeClose = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        clearTimeout(lifetime);
        try { controller.close(); } catch { /* already closed */ }
      };

      const push = async () => {
        if (closed) return;
        try {
          const snapshot = await getDashboardSnapshot();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`));
        } catch (error) {
          const message = error instanceof Error ? error.message : "stream error";
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message })}\n\n`));
        }
      };

      void push();
      const interval = setInterval(push, PUSH_INTERVAL_MS);
      const lifetime = setTimeout(safeClose, MAX_STREAM_MS);
      request.signal.addEventListener("abort", safeClose);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
