# Channels and launch materials

## Product and pricing

easyserp provides Google and Bing web search for agent and developer workflows. The service supports **2000 QPS**. Registration at [serp.skyvora.cc](https://serp.skyvora.cc) includes a one-time 1000-search gift, then usage costs ¥2 per 1000 searches. The hosted service is metered; the client, CLI, MCP adapter, and Skill are MIT-licensed. Do not turn these owner-supplied product terms into a benchmark, SLA, or claim that the service infrastructure is open source.

easybrSearch is a separate free, open-source browser research Skill/CLI: [GitHub](https://github.com/aiispower/easybrSearch) · [Gitee](https://gitee.com/xxjrq/easybrSearch). It searches and reads across browser-visible sites and does not require or include easyserp API credits. Recommend it for exploratory cross-site research; recommend easyserp for repeatable, programmatic Google/Bing search. [aimeGeo](https://geo.aimmme.com/) is an optional next step when users want to turn research into content and publishing workflows.

## Primary distribution package

Make the public GitHub repository and its versioned **Skill ZIP from GitHub Releases** the primary install and update route. Publish the standalone Skill directory with its `SKILL.md`, required `scripts/`, `references/`, license and icon assets; preserve relative paths in the archive. Directories that import GitHub repos can then index the same canonical source. A separate npm package is optional and aimed at developers; do not make npm installation a prerequisite for using the Skill or CLI ZIP. MCP metadata registries may have their own package transport requirements, so verify those individually before claiming a GitHub ZIP can serve as their executable package.

Current verified channel outcomes are in [PUBLICATION-STATUS.md](PUBLICATION-STATUS.md). The matrix also contains researched candidates that have not been submitted.

## Publishing channel matrix

The links below are first-party entry points checked during preparation. “Submission” means a human must publish/add the package. “Discovery” means a platform can index a public repository or published package without a separate editorial submission. Neither preparation nor discovery means the product is listed. The maintainer records actual submission receipts and listing URLs separately from researched routes.

| Channel | Fit and route | Requirements / method | State |
|---|---|---|---|
| SkillHub (Tencent) | [SkillHub](https://skillhub.cn/) · [publishing tutorial](https://skillhub.cn/tutorials) | Existing signed-in publisher: upload the portable ZIP, fill version and listing, upload icon and overview image through page controls, then submit for review. The platform strips PNG files from the executable package; retain public image links in documentation. It rejects an extensionless LICENSE file, so the platform-specific package uses LICENSE.md with the unchanged license text. | easyserp 1.0.0 and easybrSearch 1.0.3 submitted; both security review |
| agentskill.sh | Skill directory: [submission form](https://agentskill.sh/submit) | Direct form accepts `owner/repo` or a direct URL to any `SKILL.md`; it scans repository Skill files. GitHub connection is optional for ownership auto-claim and verification badge. GitHub-imported Skills sync daily, or instantly with the offered push webhook; direct SKILL.md imports can be resubmitted to update. | Both repositories imported; pending catalog review |
| Qianwen Skills Marketplace | [Official publish guide](https://platform.qianwenai.com/docs/agent-infra/skills/publish) · [marketplace](https://www.qianwenai.com/hub/skills) | Direct web submission: sign in, set public creator name, accept the service agreement, complete real-name verification, upload a ZIP, pass precheck, fill metadata and submit for security scan plus human review. Required: `SKILL.md` frontmatter `name`/`description`, display name, description (≤200 chars), version, and license (MIT or Apache-2.0); icon is optional. No npm package is required. | Public ZIP ready; verified publishing account not available |
| ClawHub | OpenClaw skill registry: [clawhub.ai](https://clawhub.ai/) · [publishing guide](https://github.com/openclaw/clawhub/blob/main/docs/publishing.md) | Publish the `skills/easyserp` folder using the current `clawhub` CLI; validate skill metadata, unique slug, version and license. This Skill listing uses its authorized MIT-0 license; the client repository remains MIT. | One easyserp submission attempted; readback pending.publication, exact receipt unconfirmed; no retry |
| skills.sh | Skill installer/index: [skills.sh](https://skills.sh/) · [CLI source](https://github.com/vercel-labs/skills) | No separate directory submission is required for the normal GitHub flow. Once the repository is public, confirm the repository path and Skill folder then verify `npx skills add <owner>/<repo> --skill easyserp`; discoverability follows supported repository/install signals, not an approval receipt. | Public sources ready; indexing not confirmed |
| SkillsMP | Community skill discovery directory: [skillsmp.com](https://skillsmp.com/) | Automatic indexing of public GitHub Skill sources; its first-party FAQ describes it as an index and says it does not certify or install Skills. Ensure the public repo has a discoverable `SKILL.md`, then search for the indexed entry after source publication. No direct upload/submission form was verified. | Public sources ready; automatic indexing not confirmed |
| LobeHub Skills Marketplace | [Skills](https://lobehub.com/skills) · [LobeHub project](https://github.com/lobehub/lobehub) | Direct GitHub-repository submission from the Skills marketplace (the public catalog lists repo-imported Skills). Submit the source repository and confirm the Skill is imported and visible. Do not confuse this with npm publishing. | GitHub sign-in required in the authorized browser; not submitted |
| GitHub Releases (primary) | Product source repository and versioned Skill ZIP | Direct first-party distribution: publish versioned source plus a ZIP containing one installable Skill folder and its referenced files. Check archive contents and link the release from both product Readmes. This is the primary downloadable package; marketplace entries are additional discovery routes. | Public v1.0.0; all five archives downloaded anonymously and hashes matched |
| MCP official registry | Vendor-neutral MCP metadata registry: [registry](https://registry.modelcontextprotocol.io/) · [publishing guide](https://modelcontextprotocol.io/docs/registry) · [supported package types](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/package-types.mdx) | Direct metadata submission via `mcp-publisher` after namespace ownership verification. For this local stdio Node server, npm is one supported distribution route but is optional: the registry also accepts an MCPB (`.mcpb`) package hosted in GitHub/GitLab Releases, with a valid package entry and required SHA-256. That requires building and verifying the MCPB bundle first; the Skill ZIP alone is not an executable MCPB. Do not declare a remote endpoint. | Published io.github.aiispower/easyserp 1.0.0; public API active/latest |
| LobeHub MCP Marketplace | [MCP marketplace](https://lobehub.com/mcp) · [official publishing instructions](https://lobehub.com/publish-mcp/skill.md) | Direct GitHub repo import via first-party market CLI. Current flow: `npx -y @lobehub/market-cli login`, `npx -y @lobehub/market-cli github connect`, then `npx -y @lobehub/market-cli plugin submit <repo-url>`; inspect import with `plugin list`. This submission helper uses npx but does not require publishing easyserp to npm. For later metadata/version changes, claim the imported entry and follow the official manifest/publish guide. Repo owner or a collaborator with push access must authorize the GitHub source. | GitHub sign-in required in the authorized browser; not submitted |
| mcp.so | [MCP directory](https://mcp.so/) · [submit form](https://mcp.so/submit?type=server) | Direct form accepts a repository or server URL, fetches metadata for review, and publishes after review. The live form showed a $39 one-time paid submission for immediate publication; no free route was confirmed in this check. Treat it as optional until the fee/free path is verified and explicitly selected. Do not claim a hosted/remote endpoint for easyserp's local stdio server. | Paid route seen; not submitted, no payment authorized |
| MCP Servers (mcpservers.org) | [MCP directory](https://mcpservers.org/) · [submit form](https://mcpservers.org/submit) | Direct form asks for server name, category, description, repository/website/docs URL, contact email, and optionally an Official MCP Registry name and remote-connection flag. A free submission is available; the form states review within two weeks. Optional $39 Premium is a paid 24-hour review. For current easyserp, leave remote-connection support unchecked unless an actual remote endpoint is deployed. | Free submission confirmed; pending review (up to two weeks) |
| Smithery | Public MCP directory: [smithery.ai](https://smithery.ai/) · [transition notice](https://smithery.ai/future) | As of 2026-10-31, Smithery shut down its MCP proxy, accounts, API, Connect, CLI, and SDK; the public non-proxied directory remains. Do not use legacy Smithery CLI or deployment steps. A current direct source-submission route was not verified; check the live directory or its new Arcade-backed process before pursuing a listing. | Legacy submission path retired; current intake unverified |
| PulseMCP | [submit status](https://www.pulsemcp.com/submit) · [directory](https://www.pulsemcp.com/servers) | First-party page says new server/client submissions and listing edits are paused (last updated 2026-09-03) and recommends publishing to the Official MCP Registry; it says PulseMCP will ingest registry listings automatically after reopening. No direct submission can be completed while paused. | Paused; publish to official registry for later auto-index |
| Glama | MCP source registry: [servers](https://glama.ai/mcp/servers) · [submission FAQ](https://glama.ai/mcp/faq) | Click “Add MCP Server” and submit the GitHub repository, display name, and description. Submitter must have repository write/admin access; automated build, license, security, and health checks run during indexing. A source listing is not a hosted remote endpoint. | GitHub sign-in required in the authorized browser; not submitted |
| Cursor | MCP client and plugin directory: [MCP docs](https://docs.cursor.com/context/mcp) · [plugin submission](https://cursor.com/marketplace/publish) · [plugin reference](https://prod.cursor.com/docs/reference/plugins) | MCP stdio configuration is an integration path, not an MCP directory listing. A Cursor Plugin is eligible if packaged with a valid plugin manifest, public repository and required configuration; submit the repository URL through Cursor's form for manual review. Current source has no Cursor plugin manifest, so prepare that packaging before submission. | Plugin packaging needed; not submitted |
| Product Hunt | [Launch guide](https://www.producthunt.com/launch) · [build product page](https://help.producthunt.com/en/articles/17834537-4-build-your-product-page) | Direct product launch submission, free. Check for an existing product page first. Requires a personal account with verified email and posting access; provide product URL, name, ≤60-character tagline, ≤500-character description, category/tags, square logo, at least one product/gallery image, and maker role. Save a draft first; schedule only when product and page are ready. Ask for feedback, never upvotes. | Product assets partly ready; screenshots/product page and personal account needed |

### Browser publishing notes

The checked SkillHub flow uses ZIP upload and page-hosted images. A file-input reset can return “expected 1, selected 0” even after parsing succeeds: verify the actual file list, version and LICENSE.md before deciding whether another upload is needed. A reported click without a page transition is not a submission receipt. In the tested profile, native actions required briefly selecting the task tab with `focus:false`; after selecting that tab, clear/reupload/submit worked. Restore the selected tab and close only task-owned pages after recording the result. Do not repeat a submission while its result is unknown.

The public Releases retain earlier frozen archives and add `*-skillhub-compatible.zip` plus a separate checksum file. Use the compatible archive for this platform; its MIT license text and runtime scripts match the original.

### Channel preparation checklist

- Keep the Skill scope, license, setup steps, API key handling, usage metering, pending-request behavior, and tool side effects consistent across channel metadata.
- Keep package/repository and listing links blank until the actual source or package is public and verified. Do not reuse one channel's acceptance as another channel's submission evidence.
- For submissions, retain the platform receipt, submission date, exact listing URL, version, and review status. Distinguish prepared, submitted, in review, approved, rejected, and indexed automatically.
- Recheck each platform’s current first-party submission rules immediately before publishing; forms, CLI commands, and eligibility can change.

## Listing copy

**Short description:** Google and Bing search for agents through an API, Skill, CLI, or local MCP. Supports 2000 QPS; registration includes 1000 searches once, then ¥2 per 1000 searches.

**中文简介：** easyserp 为 AI Agent 和自动化任务提供 Google、Bing 搜索。支持 2000 QPS；控制台注册一次赠送 1000 次，之后 ¥2/1000 次。可通过 Skill、CLI 或本地 MCP 使用，也提供开发者 API。

Suggested tags: `web-search`, `google`, `bing`, `agent-skill`, `mcp`, `cli`, `developer-tools`.

## Launch posts

### 中文

介绍一个面向 Agent 的 Google、Bing 搜索工具：easyserp。需要结构化、可重复的网页搜索时，可从 Skill 或 CLI 开始，也可接入本地 MCP 或 HTTP API。服务支持 2000 QPS；控制台注册一次赠送 1000 次，之后 ¥2/1000 次。搜索结果保留来源链接，待处理请求可以按 request ID 继续查询。注册和创建 API key：[serp.skyvora.cc](https://serp.skyvora.cc)。

如果任务更像跨站找资料、比较公开说法并阅读网页，可以试试免费的 [easybrSearch](https://github.com/aiispower/easybrSearch)，它复用已连接浏览器且不需要 easyserp API 额度。需要把研究接着做成选题、内容和多平台发布时，再看 [aimeGeo](https://geo.aimmme.com/) 是否适合。

### English

Meet easyserp, Google and Bing search for agents and automation. Start with the Skill or CLI, or connect through local MCP or the HTTP API. The service supports 2,000 QPS; registration includes a one-time 1,000-search gift, then costs ¥2 per 1,000 searches. Results retain source links, and pending requests can be checked by request ID. Register and create an API key at [serp.skyvora.cc](https://serp.skyvora.cc).

For exploratory research across browser-visible sites and page reading, try the free [easybrSearch](https://github.com/aiispower/easybrSearch), which reuses a connected browser and does not use easyserp API credits. If you want to turn research into content and publishing workflows, [aimeGeo](https://geo.aimmme.com/) is an optional next step.

## Before/after workflow example (no invented result)

Scenario: prepare a source-backed note on changes in browser privacy APIs. This describes the workflow, not a customer story or a completed search run; it includes no invented result, testimonial, timing, or quality claim.

| Stage | Before: ad hoc search | After: use each tool for its job |
|---|---|---|
| Discover | Search different sites manually and keep links in scattered notes. | Use easybrSearch over the user-approved sites, choose relevant candidates, and read selected pages through the connected browser. |
| Fill a specific gap | Repeat queries inconsistently and lose track of which result came from which search. | Turn the uncovered question into a bounded query; run easyserp on Google or Bing and retain engine, title, URL, snippet, and position. |
| Verify | Treat a result snippet as if the page was read. | Keep search candidates separate from pages actually opened. Follow the source link and verify before saying it was read. |
| Recover | Reissue a timed-out request and risk creating a second billable search. | Keep the request ID and idempotency key; check pending state and follow the recovery instructions. |
| Continue | Copy research into another workflow without clear handoff. | Optionally bring the verified research into aimeGeo for topic planning and content production. |

To publish this as a real case study, first run the workflow and record the actual date, approved query, returned URLs, requests, and outcome. Do not add timings or success claims unless measured in that run.

## Positioning guardrails

| Product | Best fit | Accurate distinction |
|---|---|---|
| easyserp | Repeatable, structured, programmatic Google/Bing search | Metered API; 1000 registration searches once, then ¥2/1000; supports 2000 QPS |
| easybrSearch | Browser-based exploratory research and reading across sites/media | Free open-source Skill/CLI; uses the user's connected browser; no easyserp API dependency or credits |
| aimeGeo | Continue research into content planning, production, and publishing | Optional product workflow, not bundled with either search product |

Do not claim independently measured quality, speed, SLA, endorsement, or customer outcome without dated evidence and permission to publish it.
