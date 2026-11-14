# EasySERP MCP Bundle

EasySERP is distributed as a standalone MCP Bundle (`.mcpb`) for Claude Desktop and compatible MCP clients on macOS, Windows, and Linux. The bundle contains the Node.js MCP server, its runtime dependencies, the icon, README, and license; installation does not require npm or a separate package install. Node.js 20 or later is required.

## Install and configure

Download `easyserp-1.0.0.mcpb` from the GitHub release, then open the file with Claude Desktop or import it in a compatible MCP client. Add an EasySERP API key in the extension configuration to run searches. The key is stored as a sensitive setting and passed to the local server through `EASYSERP_API_KEY`. The capabilities tool works without a key.

The MCPB release URL is planned as:

`https://github.com/aiispower/easyserp/releases/download/v1.0.0/easyserp-1.0.0.mcpb`

The official MCP Registry metadata is in the adjacent `server.json`. Its package URL and SHA-256 are prepared for the planned GitHub Release; the asset is not available until the maintainer uploads it.

## Tools

- `easyserp_search`: Google or Bing search with optional domain inclusion/exclusion and bounded retries.
- `easyserp_batch_search`: Up to 100 queries with bounded concurrency, per-query results, and partial failure reporting.
- `easyserp_request`: Recover a known request receipt without issuing a new search.
- `easyserp_capabilities`: Show engines, setup, and pricing without an API key or search request.

Each successful new query is billable. The bundle returns a successful search immediately; it does not repeat a paid search to improve relevance. It filters source domains against returned URLs, reports when requested source coverage is unmet, and preserves original API rows separately from the filtered rows. Search snippets are result metadata, not full-page evidence.

## Build and verify

From the repository root, run:

```sh
node scripts/build-mcpb.mjs
```

This invokes the official public `@anthropic-ai/mcpb` CLI through `npx`, stages only the allowlisted runtime files, validates and packs the extension, performs an offline MCP protocol smoke test, computes SHA-256, and updates `server.json`. It does not upload or publish anything. Build details and file inventories are written under `.local/distribution-20261114/mcpb/`.

The MCPB manifest follows the official MCPB 0.3 format. The registry metadata uses `registryType: "mcpb"`, a planned GitHub Release URL, and the artifact SHA-256 required by the official MCP Registry. Registry submission and release upload are separate maintainer actions.
