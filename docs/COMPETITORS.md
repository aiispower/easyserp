# 产品对照与路线建议

本页用于产品定位和路线讨论。外部产品能力来自各自公开页面，页面会变化，发布前再次核验。这里只比较公开定位，不推断数据授权、准确率或服务表现。

## 开发者搜索 API 与 MCP

| 产品 | 官方材料中可见的产品方向 | 对 easyserp 的启发 |
|---|---|---|
| Tavily | Search API 与 MCP；官方 MCP 提供 remote HTTP 和 local bridge 使用方式，工具覆盖搜索、提取、爬取、站点地图、研究 | 用清晰的安装入口、每个工具的具体说明和多 MCP host 示例降低接入成本；easyserp 目前是本地 stdio server，文档须准确描述这一点 |
| Exa | Web/code search、页面获取及其他 MCP 工具；公开 hosted MCP endpoint，并提供 search/fetch 的免费体验额度 | 让用户能快速试用并说明 API/MCP 能力边界；easyserp 不应暗示已提供托管 remote MCP |
| SerpApi | 搜索引擎结果 API，文档详细列出 engine、地区、设备、参数和 JSON/Markdown 等返回形态 | 给每个查询参数清楚的契约和示例；easyserp 当前聚焦 Google + Bing，并提供明确的幂等、pending 恢复说明 |
| Serper | Google Search API 产品，列有 Search、Images、News、Maps、Places、Videos、Shopping、Scholar、Patents、Autocomplete 等用途 | 给用户清晰的 Google 搜索垂直能力入口；easyserp 侧重 Google + Bing 双引擎，并明确注册赠送与后续单价 |
| Brave Search API | Brave 自有搜索索引的 API，公开介绍 API 能力与额度入口 | 说明 easyserp 的双引擎覆盖与简单计价；不声称比对方更快、更便宜或更准确 |
| Apify | MCP 可搜索并运行 Apify Store Actors、访问存储与结果；支持托管 Streamable HTTP/OAuth 和本地 stdio | 搜索基础设施与可执行第三方数据 Actor 是不同交付面；easyserp 的 MCP 是本地 stdio，核心是直接执行 Google/Bing 搜索 |
| Firecrawl | Search API 返回结构化网页搜索结果；可选在一次搜索调用中抓取完整页面内容，并提供 web/news/images 等来源类别 | 把“搜索结果”与“读取页面内容”作为不同动作说明。easyserp 目前返回 SERP 字段和链接，不应描述为页面抓取或全文检索 |

来源：[Tavily MCP 官方文档](https://docs.tavily.com/documentation/mcp)、[Exa MCP 官方文档](https://exa.ai/docs/reference/exa-mcp)、[SerpApi Search API 官方文档](https://serpapi.com/search-api)、[Serper 官网](https://serper.dev/)、[Brave Search API 官网](https://brave.com/search/api/)、[Apify MCP 官方文档](https://docs.apify.com/mcp)、[Firecrawl Search 官方文档](https://docs.firecrawl.dev/features/search)。

## 自媒体与社媒数据产品

这些产品属于社媒数据 API、内容检索或经营分析 SaaS，和通用搜索 API 的目标用户及数据授权模型不同。它们可帮助确定未来调研方向，不构成 easyserp 已具备对应平台数据能力的证据。

| 产品 | 官方页面公开定位 | 可借鉴点 | easyserp 当前边界 |
|---|---|---|---|
| TikHub | 多平台社媒数据 API，并提供平台工具配置的 MCP 页面 | API 与 MCP 可按平台/能力模块清楚组织 | 未来如增加社媒搜索，需逐个平台验证登录、权限、字段、频率和稳定性；当前只承诺 Google + Bing |
| 千瓜 | 小红书笔记/评论搜索、筛选和分析，以及套餐定价页面 | 搜索条件、筛选维度与分析输出应和具体工作流绑定 | 不承诺历史内容全量、热度真实性、用户画像覆盖或任何未经验证的官方授权关系 |
| 新榜 | 跨平台内容榜单、内容数据和定制 API 等服务 | 从单次搜索扩展到内容趋势与运营工作流，需要单独的数据产品和交付设计 | 不将榜单、定制数据或商业分析能力写成现有 API 功能 |
| 蝉妈妈 | 内容、达人和电商数据服务 | 创作者/商品运营场景是单独的垂直产品机会 | 不宣称当前提供达人、商品、成交或电商数据库 |

来源：[TikHub FAQ](https://tikhub.io/zh/faq)、[TikHub MCP](https://mcp.tikhub.io/)、[千瓜笔记/评论搜索介绍](https://www.qian-gua.com/blog/detail/136.html)、[千瓜套餐](https://www.qian-gua.com/Home/AllPrice)、[新榜](https://www.newrank.cn/?lang=zh)、[蝉妈妈](https://www.chanmama.com/)。

## 建议路线

1. **先交付 easyserp 的开发者搜索基础设施。** 做好 Google + Bing 的稳定接入、准确的输入/输出文档、Node.js/CLI/MCP、幂等重放与 pending 恢复，以及控制台注册到首次成功请求的转化。
2. **让 easybrSearch 与 easyserp 配合，各自服务不同工作。** easybrSearch 是免费浏览器研究工具，可用于跨网页和自媒体平台探索、人工检查已登录页面和收集来源；easyserp 是面向开发者的高吞吐计量 API，适合结构化 Google/Bing 搜索和自动化调用。组合方案可先由 easybrSearch 帮用户发现值得跟进的主题，再用 easyserp 对明确的问题做 API 搜索。无需互相替代，也不应把浏览器研究能力冒充成 API 覆盖。
3. **验证自媒体平台需求再做原生服务端连接。** 每个平台单独验证登录状态、接口可用性、条款/授权边界、可见字段、分页、采样与变化频率。提供具体平台和具体字段的实测说明；任何不可见字段、全量历史、真实热度、授权或稳定性结论都先不做承诺。
4. **在有稳定数据来源后评估垂直 SaaS。** 内容发现、达人库、商品分析、榜单和趋势研究需要独立产品设计、数据质量指标和商业模式，不能由搜索 API 的存在直接推出。

## 验证与公开表达

- 先写可证伪的用户问题，例如“运营人员能否按关键词发现近期公开笔记”，再定义平台、登录态、地区、时间范围、结果字段、分页上限和复测方法。
- 在测试矩阵记录执行日期、账号/会话要求、请求方式、返回字段与失败情形；避免保留不必要的个人数据或凭证。
- 以实际可见页面或接口字段为边界。没有证据时，不声称历史全量、稳定频率、真实热度、官方授权或平台认可。
- easyserp 现有商业属性保持明确：支持 2000 QPS，注册赠送 1000 次（一次性，不是每月），后续 ¥2/1000 次。
