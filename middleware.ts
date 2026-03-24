import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSuperAdminUser } from "@/lib/auth/super-admin";

const AUTH_PREFIX = "/auth";
const PROTECTED = [
  "/dashboard",
  /* TEMP (local test UI /play): bỏ comment dòng dưới trước khi commit hoặc deploy.
   * Lưu ý: POST /api/run/start và commentary vẫn cần session Supabase — chỉ bỏ redirect trang. */
  // "/play",
];
const GAME_ADMIN = "/game-admin";

function isGameAdminPath(pathname: string) {
  return pathname === GAME_ADMIN || pathname.startsWith(`${GAME_ADMIN}/`);
}

function isProtectedPath(pathname: string) {
  return PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (isGameAdminPath(pathname)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `${AUTH_PREFIX}/login`;
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (!isSuperAdminUser(user)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `${AUTH_PREFIX}/login`;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (
    user &&
    (pathname === `${AUTH_PREFIX}/login` || pathname === `${AUTH_PREFIX}/register`)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
