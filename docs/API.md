# API 与 SDK 行为

Base URL：`https://serp.skyvora.cc`。搜索接口为 `POST /api/v1/search`，使用 `Authorization: Bearer <API_KEY>`。密钥不得出现在 URL、日志或进程参数中。

## 请求

SDK/CLI 接受严格字段，不会把任意用户参数透传到服务：

| 字段 | 规则 |
|---|---|
| `q` | 1–200 字符 |
| `engine` | `google` 或 `bing` |
| `region` | 两字母国家/地区代码，例如 `US`、`CN`、`BR`、`PL`；默认 `US`，实际可用性取决于服务环境 |
| `device` | `desktop` 或 `mobile`；默认 `desktop` |
| `idempotency_key` | 8–128 字符；默认随机 UUID |
| `wait_ms` | 0–30000；省略时服务等待 30 秒 |
| `max_attempts` | 1–3 |
| `channel` | 可选，最多 64 字节 |
| `count` | Google 和 Bing 均支持；10–50，默认 10 |
| `start` | Google 和 Bing 均支持；0–10000，默认 0 |
| `cursor` | Google 为 0–10000 的 next-page start；Bing 为 1–10001 的 next-page first value。API JSON 中为字符串；SDK 可接收整数并归一化为字符串 |
| `resolve_urls` | 仅 Google 可选布尔值；Bing 请求会被拒绝 |
| `gl`, `hl` | Google 和 Bing 均支持；locale 字段最多 16 字节 |
| `mkt` | Bing content market，格式为 `language-country`，例如 `zh-CN`；最多 16 字节 |
| `cc` | Bing 两字母国家代码，必须与 `region` 一致 |

`cursor` 与 `start` 同时使用且 `start > 0` 时必须对应：Google 的 `cursor == start`；Bing 的 `cursor == start + 1`。Bing `hl` 是 2–3 个英文字母语言代码，例如 `zh`，不是 `zh-CN`；`mkt` 才使用 `zh-CN` 这种语言-国家格式。Bing `gl` 也必须与 `region` 一致。SDK/CLI 对 Bing 请求拒绝 `resolve_urls`，对 Google 请求拒绝 Bing 专属的 `mkt`、`cc`。批处理最多 100 项，并发度 1–32。

## 成功和待处理

HTTP 200 成功响应含 `request_id`、`status: "succeeded"`、`organic`、`related_searches`、`related_questions`、`pagination`、`charged`、`server_duration_ms` 和 `search_parameters`。客户端保留真实返回字段和重定向标记，不合成搜索结果。

202 或 504 且 `error.code` 为 `request_pending` 时，`status` 为 `queued` 或 `running`。这是**非终态**。保留 request ID 和幂等键；`GET /api/v1/requests/{id}` 可查询已知请求，需要 requests scope。不要据此报告失败或退款。

相同幂等键和相同 payload 会指向同一请求；相同键配不同 payload 返回 409。网络超时本身不确定最终状态。搜索成功扣费一次；失败释放额度预留。没有余额查询接口。

## User-facing search behavior

The CLI `search` command uses the higher-level relevant-results workflow. It deduplicates and ranks organic results, preserves the original result set and quality/warning information, and records bounded attempt/recovery history. It makes at most three POST attempts by default, with a 120-second overall deadline. Pending requests remain pending; the command does not turn them into a fresh request. `--include-domain DOMAIN` and `--exclude-domain DOMAIN` can each be repeated. Explicit `site:` query scope is honored in the final result set even if a search engine broadens its response; no synthetic URLs are created.

The raw `search()` SDK method remains available for an unfiltered API response. `searchRelevant()` is the optional higher-level SDK method for bounded recovery and source filtering. The MCP `easyserp_search` tool accepts `include_domains`, `exclude_domains`, and `retries` for the same workflow. Refer to the installed tool schema for exact structured output; consumers should not assume fields beyond the documented API contract.

## SDK / CLI

SDK 从 `src/client.mjs` 导出 `EasySerpClient`、`EasySerpError`。客户端可显式配置 `apiKey`、`baseUrl`、`timeoutMs`、`fetchImpl`；凭据可由 `EASYSERP_API_KEY` 或 `EASYSERP_API_KEY_FILE` 提供（也兼容旧变量 `SKYVORA_API_KEY`、`SERP_API_TOKEN`）。方法包括 `.search(params, {signal})`、`.searchRelevant(params, options)`、`.getRequest(id, {signal})` 和 `.batchSearch(queries, {concurrency, signal})`。错误可通过 `.toJSON()` 安全序列化。

CLI：`search QUERY`、`batch FILE`、`request ID` 和 `--help`。搜索支持 `--engine`、`--region`、`--format json|markdown`、`--idempotency-key`、可重复的 `--include-domain`、`--exclude-domain` 及 `--retries`；批处理支持 `--concurrency`。不把 key 打印到 stdout/stderr。

底层 `.search()` 不自动轮询或重试。CLI 与 `.searchRelevant()` 使用有界的恢复流程；若自行处理 429，应遵守 `Retry-After`。
