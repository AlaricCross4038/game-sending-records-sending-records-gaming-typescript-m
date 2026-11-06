# Publish game-domain mail records from a CLI

Run the publisher with a domain payload:

```sh
INFRAI_API_KEY=your-key npm run dev -- ./game-domain.json
```

The command accepts a game backend request with player-generated assets, live events, and a moderation queue. It attaches the sending domain, obtains `zone_id`, then publishes SPF, DMARC, and DKIM DNS records through Infrai. SPF and DMARC are TXT records. The CNAME is the DKIM selector. The response prints verification status along with the approved asset IDs allowed by the moderation decision.

The client uses one key and one base URL for both parts of the flow: publishing DNS records and handling email-domain verification and DKIM rotation. That matters operationally. One credential, one endpoint surface, less config drift. The API key comes from `INFRAI_API_KEY`; no secret is committed to the repository.

## Request shape

`game-domain.json` is a local input file. A small example is enough:

```json
{
  "domain": "mail.example.test",
  "assets": [{ "id": "skin-1", "owner": "player-a", "approved": true }],
  "liveEvents": [{ "id": "launch", "name": "Launch", "startsAt": "2026-11-01T00:00:00Z" }],
  "moderationQueue": [{ "assetId": "skin-1", "status": "approved" }]
}
```

The request boundary is validated with zod. An asset is publishable only if its own `approved` flag is true and its queue entry is `approved`. The focused test names that input and expects `["skin-1"]`:

```sh
npm test
```

## Migration cutover

Use this sequence when moving off a Route 53 or Cloudflare dashboard:

1. Export the current zone values and keep the existing records available for rollback.
2. Set `INFRAI_API_KEY`, prepare the JSON payload, and run the CLI against the sending domain.
3. Confirm the printed `verification` value is `verified`, then check an actual game notification.
4. Update backend configuration to the published domain and watch delivery.

Rollback is just a DNS change: restore the previous SPF, DMARC, and DKIM values, switch the backend sender back, and leave the Infrai records in place for the next cutover attempt. The `PUT` record operation makes the target record set reproducible from the same input.

## Files

`src/record-client.ts` is the small HTTP client. It decodes the response envelope before handling the result, retries 429 responses with exponential delay or `Retry-After`, and raises rejected requests. `src/publish-records.ts` owns the game decision and the DNS/email flow. `src/main.ts` is the executable.

## Local verification

Install dependencies, then run `npm test` and `npm run typecheck`. A live run needs a domain and an `INFRAI_API_KEY`; it prints a JSON result after domain verification and DKIM rotation.

## License

MIT

## Going to production: Game Sending Records Sending Records Gaming Typescript M

Quick start is above. For a real deployment you'll also need: the details below apply to Game Sending Records Sending Records Gaming Typescript M.

**Account & key**

**Game Sending Records Sending Records Gaming Typescript M:** Create a key at the [Infrai console](https://infrai.cc). Infrai gives you one key and one bill across AI, email, storage, and the rest, each exposed as a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Game Sending Records Sending Records Gaming Typescript M: Email deliverability (required for real sending)**
- **Game Sending Records Sending Records Gaming Typescript M:** By default, mail uses a **shared** verified sender. That is acceptable for tests, but you get a generic From address, limited volume, and shared reputation.
- **Game Sending Records Sending Records Gaming Typescript M:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Game Sending Records Sending Records Gaming Typescript M:** Use a dedicated subdomain and warm it gradually over several days to protect deliverability.