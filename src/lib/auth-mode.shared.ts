export function isAuthenticationEnabled(mode: string | undefined): boolean {
  return mode?.trim().toLowerCase() !== "disabled";
}

export function shouldReadAuthenticationSession(mode: string | undefined, cookie: string): boolean {
  return isAuthenticationEnabled(mode) && cookie.includes("hub_session");
}

export function disabledAuthRedirect(request: Request): Response {
  return Response.redirect(new URL("/", request.url), 302);
}
