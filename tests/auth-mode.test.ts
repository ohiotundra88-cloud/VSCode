import test from "node:test";
import assert from "node:assert/strict";
import {
  disabledAuthRedirect,
  isAuthenticationEnabled,
  shouldReadAuthenticationSession,
} from "../src/lib/auth-mode.shared.ts";

test("authentication is enabled unless AUTH_MODE is explicitly disabled", () => {
  assert.equal(isAuthenticationEnabled(undefined), true);
  assert.equal(isAuthenticationEnabled("aspire"), true);
  assert.equal(isAuthenticationEnabled(" disabled "), false);
});

test("disabled authentication sends login requests back to the public home page", () => {
  const response = disabledAuthRedirect(
    new Request("https://preview.example/auth/login?returnTo=/admin"),
  );
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://preview.example/");
});

test("disabled authentication never reads a legacy Aspire session cookie", () => {
  assert.equal(shouldReadAuthenticationSession("disabled", "hub_session=legacy"), false);
  assert.equal(shouldReadAuthenticationSession("aspire", "hub_session=legacy"), true);
  assert.equal(shouldReadAuthenticationSession("aspire", "other=value"), false);
});
