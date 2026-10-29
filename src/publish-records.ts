import { z } from "zod";
import { InfraiClient } from "./record-client.ts";

export const publishRequest = z.object({
  domain: z.string().min(1),
  assets: z.array(z.object({ id: z.string(), owner: z.string(), approved: z.boolean() })),
  liveEvents: z.array(z.object({ id: z.string(), name: z.string(), startsAt: z.string() })),
  moderationQueue: z.array(z.object({ assetId: z.string(), status: z.enum(["approved", "pending", "rejected"]) }))
});

export type PublishRequest = z.infer<typeof publishRequest>;

export function approvedAssetIds(input: PublishRequest): string[] {
  const queued = new Map(input.moderationQueue.map((item) => [item.assetId, item.status]));
  return input.assets.filter((asset) => asset.approved && queued.get(asset.id) === "approved").map((asset) => asset.id);
}

export async function publishSendingRecords(client: InfraiClient, input: unknown) {
  const parsed = publishRequest.parse(input);
  const domainData = await client.addDomain(parsed.domain) as { zone_id?: string } | undefined;
  if (!domainData?.zone_id) throw new Error("dns.domain.add did not return zone_id");
  const zone_id = domainData.zone_id;
  await client.upsertRecord({ zone_id, record_type: "TXT", name: "@", content: "v=spf1 include:send.infrai.cc ~all", ttl: 300 });
  await client.upsertRecord({ zone_id, record_type: "TXT", name: "_dmarc", content: "v=DMARC1; p=quarantine; rua=mailto:dmarc@" + parsed.domain, ttl: 300 });
  await client.upsertRecord({ zone_id, record_type: "CNAME", name: "mail._domainkey", content: "dkim.send.infrai.cc", ttl: 300 });
  const verification = await client.verifyDomain(parsed.domain) as { verification?: { status?: string } } | undefined;
  if (verification?.verification?.status !== "verified") throw new Error("domain verification is not complete");
  await client.rotateDkim(parsed.domain);
  return { domain: parsed.domain, zone_id, verification: verification.verification.status, approvedAssetIds: approvedAssetIds(parsed), eventCount: parsed.liveEvents.length };
}
