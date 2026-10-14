import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routeSource = readFileSync("src/routes/my-fundraisers.$id.tsx", "utf8");
const serverSource = readFileSync("src/lib/fundraising-pages.server.ts", "utf8");

test("fundraiser management reuses the visual approval tracker", () => {
  assert.match(routeSource, /import \{ ApprovalTracker \} from "@\/components\/ApprovalTracker";/);
  assert.match(routeSource, /<ApprovalTracker request=\{approval\} \/>/);
  assert.doesNotMatch(routeSource, /Captain:\s*\{approval\[k\]\}/);
});

test("fundraiser approval lookup returns every field the tracker presents", () => {
  for (const field of ["event_type", "event_id", "created_at", "updated_at"]) {
    assert.match(serverSource, new RegExp(`approvalState[\\s\\S]*?select\\([\\s\\S]*?${field}`));
  }
});
