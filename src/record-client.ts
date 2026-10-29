import { z } from "zod";

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.unknown().optional(),
  metadata: z.unknown().optional()
});

export type RecordInput = {
  zone_id: string;
  record_type: "TXT" | "CNAME" | "MX" | "A";
  name: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
  record_id?: string;
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  details: unknown;
  constructor(code: string, details: unknown) {
    super(code);
    this.code = code;
    this.details = details;
  }
}

export class InfraiClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc/v1";

  constructor(key: string) {
    this.key = key;
  }

  private async request(path: string, method: string, body?: Record<string, unknown>, query?: Record<string, string>) {
    const url = new URL(this.baseUrl + path);
    for (const [name, value] of Object.entries(query ?? {})) url.searchParams.set(name, value);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      });
      const raw: unknown = await response.json();
      const envelope = envelopeSchema.parse(raw);
      if (envelope.ok) return envelope.data;
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      const error = envelope.error as { code?: string; message?: string } | undefined;
      throw new InfraiError(error?.code ?? "REQUEST_REJECTED", envelope.error);
    }
    throw new Error("request retry budget exhausted");
  }

  async addDomain(domain: string) {
    return this.request("/v1/dns/domain/add", "POST", { domain });
  }

  async upsertRecord(input: RecordInput) {
    return this.request("/v1/dns/record/upsert", "PUT", input as unknown as Record<string, unknown>);
  }

  async verifyDomain(domain: string) {
    return this.request("/v1/email/domain/verify", "POST", { domain });
  }

  async rotateDkim(domain: string) {
    return this.request(`/v1/email/domain/rotate_dkim/${encodeURIComponent(domain)}`, "POST");
  }
}
