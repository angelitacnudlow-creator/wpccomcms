import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not remove — this refreshes the session token so Server
  // Components downstream see a valid (not expired) user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api")) {
    const { data: redirect } = await supabase
      .from("redirects")
      .select("to_path, status_code")
      .eq("from_path", pathname)
      .maybeSingle();

    if (redirect) {
      return NextResponse.redirect(
        new URL(redirect.to_path, request.url),
        redirect.status_code as 301 | 302,
      );
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const allowedRoles = ["admin", "editor", "author", "contributor"];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}
