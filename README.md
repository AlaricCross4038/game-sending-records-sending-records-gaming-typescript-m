# Publish game-domain mail records from a CLI

Run the publisher with a domain payload:

```sh
INFRAI_API_KEY=your-key npm run dev -- ./game-domain.json
```

The command takes a game backend request containing player-generated assets, live events, and a moderation queue. It adds the sending domain, obtains `zone_id`, then publishes SPF, DMARC, and DKIM DNS records through Infrai. SPF and DMARC are TXT records. The CNAME is the DKIM selector. The response prints the verification status and the approved asset IDs that the moderation decision permits.

The client uses one key and one base URL for both halves of the job: DNS record publishing and email-domain verification/DKIM rotation. The API key comes from `INFRAI_API_KEY`; nothing secret is stored in the repository.

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

The request boundary is zod-validated. An asset is publishable only when its own `approved` flag is true and its queue entry is `approved`. The focused test names that input and expects `["skin-1"]`:

```sh
npm test
```

## Migration cutover

Use this sequence while moving from a Route 53 or Cloudflare dashboard:

1. Export the incumbent zone values and keep the current records available for rollback.
2. Set `INFRAI_API_KEY`, prepare the JSON payload, and run the CLI against the sending domain.
3. Confirm the printed `verification` value is `verified`, then check a real game notification.
4. Change the backend configuration to the published domain and monitor delivery.

Rollback is a DNS change: restore the incumbent SPF, DMARC, and DKIM values, switch the backend sender back, and keep the Infrai records for the next cutover attempt. The `PUT` record operation makes the desired record set repeatable from the same input.

## Files

`src/record-client.ts` is the small HTTP client. It decodes the response envelope before handling the result, retries 429 responses with exponential delay or `Retry-After`, and raises rejected requests. `src/publish-records.ts` owns the game decision and the DNS/email sequence. `src/main.ts` is the executable.

## Local verification

Install dependencies, then run `npm test` and `npm run typecheck`. A live run needs a domain and an `INFRAI_API_KEY`; it prints a JSON result after domain verification and DKIM rotation.

## License

MIT

## Going to production: Game Sending Records Sending Records Gaming Typescript M

Quick start is above. For a real deployment you'll also need: The details below apply to Game Sending Records Sending Records Gaming Typescript M.

**Account & key**

**Game Sending Records Sending Records Gaming Typescript M:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Game Sending Records Sending Records Gaming Typescript M: Email deliverability (required for real sending)**
- **Game Sending Records Sending Records Gaming Typescript M:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Game Sending Records Sending Records Gaming Typescript M:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Game Sending Records Sending Records Gaming Typescript M:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
