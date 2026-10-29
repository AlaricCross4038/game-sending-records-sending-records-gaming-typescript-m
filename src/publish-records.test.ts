import test from "node:test";
import assert from "node:assert/strict";
import { approvedAssetIds } from "./publish-records.ts";

test("only approved player assets are included in the publish result", async () => {
  const result = approvedAssetIds({
    domain: "mail.example.test",
    assets: [
      { id: "skin-1", owner: "player-a", approved: true },
      { id: "skin-2", owner: "player-b", approved: true },
      { id: "skin-3", owner: "player-c", approved: false }
    ],
    liveEvents: [{ id: "launch", name: "Launch", startsAt: "2026-11-01T00:00:00Z" }],
    moderationQueue: [
      { assetId: "skin-1", status: "approved" },
      { assetId: "skin-2", status: "pending" },
      { assetId: "skin-3", status: "approved" }
    ]
  });
  assert.deepEqual(result, ["skin-1"]);
});
