import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // ✅ Same as your working configuration
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/generate-questions",
    "/api/score-answers",
    // ✅ Add leaderboard for global access only
  ],

  ignoredRoutes: [
    "/((?!api|trpc))(_next.*|.+\\.[\\w]+$)",
    "/api/webhooks(.*)",
    "/_next/static(.*)",
    "/_next/image(.*)",
    "/favicon.ico",
  ],

  afterAuth(auth, req, evt) {
    // Skip processing for static files
    if (req.nextUrl.pathname.startsWith("/_next")) {
      return;
    }

    // User signed in but trying to access auth pages
    if (
      auth.userId &&
      (req.nextUrl.pathname.startsWith("/sign-in") ||
       req.nextUrl.pathname.startsWith("/sign-up"))
    ) {
      return Response.redirect(new URL("/", req.url));
    }

    // User not signed in but trying to access protected route
    if (!auth.userId && !auth.isPublicRoute) {
      return Response.redirect(new URL("/sign-in", req.url));
    }
  },
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
