import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed `middleware.ts`/`middleware()` to `proxy.ts`/`proxy()`.
// NOTE: Server Actions are called as POSTs to the page that invoked them, so
// a matcher excluding a path also skips Server Actions on that path — this
// proxy is a UX-level redirect for page loads, not the source of truth for
// authorization. Every Server Action below still re-checks auth/role itself.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
