---
status: ready_for_review_not_posted
channels: [知乎, 掘金, CSDN]
content_type: developer workflow
---

![easyserp 图标](../../assets/easyserp-icon.png)

# 给 Claude 和 Codex 用的搜索工作流：浏览器研究与结构化 API 各做一件事

写代码、做竞品研究或整理技术资料时，搜索需求经常分成两类：一类是先在多个网站发现线索，然后打开页面读原文；另一类是把明确的查询稳定地交给程序，拿到可过滤、可记录的搜索结果。让一个工具同时包办两类工作，常会把页面阅读和 API 调用的差异藏起来。

我们把这条工作流拆成两个独立产品：免费的浏览器研究工具 [easybrSearch](https://github.com/aiispower/easybrSearch)，以及 Google/Bing 搜索 API easyserp。它们都提供 Agent Skill 接入，适用于支持 Skill 的 Claude Code、Codex 等宿主；使用时仍由宿主 Agent 理解问题并组织结果。easyserp CLI 不内置 LLM，也不会悄悄启动另一个收费模型。

## 先确定问题属于哪一类

当问题开放、来源跨站，或需要在已有登录浏览器中找内容并阅读页面时，先用 easybrSearch。它复用已连接的浏览器，可按用户指定的平台集合搜索，再让 Agent 从候选中挑选少量来源阅读。它不需要 easyserp 的 API key 或额度；页面能否访问仍取决于浏览器连接、账号权限和网站状态。

当问题已经足够明确，需要程序化、重复或批量调用 Google/Bing 时，使用 easyserp。服务支持 2000 QPS；控制台注册赠送 1000 次搜索（一次性），之后 ¥2/1000 次。不同调用入口共用这项按量计费服务。普通用户可以安装 easyserp Skill 后直接对话搜索；开发者再按需选择 CLI、MCP stdio 或 HTTP API。SDK 是可选集成接口，不是普通用户的第一步。

## 一次可以照着做的工作流

假设要准备一份“浏览器隐私 API 的近期变化”资料摘要。首先明确允许搜索的平台和时间范围。用 easybrSearch 在指定网站找线索，选择贴题的候选并读取页面；记录哪些内容确实读过、哪些只是搜索摘要。读完后，列出尚未解决的问题，例如某项 API 是否已进入正式文档。

针对这个缺口，再用 easyserp 搜索 Google 或 Bing。若希望结果限定在几个域名，可明确添加域名过滤，例如：

```sh
node src/cli.mjs search "browser privacy API" \
  --engine google \
  --include-domain developer.mozilla.org \
  --include-domain w3.org \
  --format markdown
```

命令需要先在当前环境设置 `EASYSERP_API_KEY`，并在 easyserp 项目目录或已安装的 CLI 环境中运行。它适合拿到结构化搜索结果；返回标题和摘要后，若结论依赖页面正文，应再打开原始链接核对。`site:` 查询范围也会在最终结果中维持，不因为搜索引擎返回了范围外链接就把它说成范围内来源。

完成后分开交接两组材料：easybrSearch 实际读取的页面证据，以及 easyserp 返回的搜索候选。两者合并成答案时，各项事实应链接到对应的原始页面；未读内容仍按线索描述，不能把摘要升级成全文结论。需要把研究转成选题、文章或发布任务时，可以按需继续使用 [aimeGeo](https://geo.aimmme.com/)，它不是这两个搜索工具的捆绑组件。

## 失败与恢复也要区分

搜索请求超时不等于服务没收到请求。easyserp 的用户向搜索流程会做有界恢复，默认最多三次尝试，并保留请求与恢复记录；它不会把仍在处理的请求自动当作失败后再起一笔新搜索。看到 pending 状态时，保留 request ID 并查询原请求。域名过滤后没有匹配结果，就返回空结果和相应提示，不伪造链接，也不悄悄把范围放宽。

浏览器研究也可能只拿到搜索卡片、摘要或受限页面。easybrSearch 会保留读取状态和范围，避免把“找到一个结果”写成“已经看完原文”。如果用户限定只搜某个平台，工具与 Agent 都不应擅自加搜索引擎或公开索引回退。

这套分工的价值是让每一步能说清楚：哪个工具找到候选、哪个页面真正读过、搜索调用是否仍待处理，以及下一步是不是程序化搜索。它没有消除搜索引擎、网站或网络本身的不确定性。

## 本轮验收记录

本轮 easyserp 自动化测试 **37 项通过**。另有 **12 个真实查询样例**：11 次收到 API 返回，1 次以终态不可用结束。域名过滤下也出现过零条匹配的情况；工具按实际结果返回空集并提示范围问题，不补造链接。这组样例只说明这些查询当时的结果，不等于所有地区、语言和来源都可用，也不是准确率或性能基准。

easyserp 的服务入口与 API key 创建方式：[serp.skyvora.cc](https://serp.skyvora.cc)。easybrSearch 开源源码：[GitHub](https://github.com/aiispower/easybrSearch) · [Gitee](https://gitee.com/xxjrq/easybrSearch)。easyserp 的 Skill 与 CLI ZIP 将以 GitHub Release 作为主要下载方式；npm 包为开发者可选路线，具体链接以公开发布页为准。
