---
status: ready_for_review_not_posted
channels: [公众号, 头条]
content_type: product introduction
---

![easyserp 与 easybrSearch 产品组合图](../../assets/easy-search-family-banner.png)

# 找资料，为什么我们做成了两个工具

搜索看起来只是输入几个词、点一下回车。但真正开始做研究后，大家很快会遇到两种不同的工作：一种是跨网站找线索、打开页面读原文；另一种是稳定地调用搜索、拿到结构化结果，交给程序继续处理。它们都叫“搜索”，使用方式却不一样。

所以我们做了两个彼此独立的工具：easybrSearch 和 easyserp。前者复用用户已经连接的浏览器，后者提供 Google 和 Bing 搜索 API。可以只用其中一个，也可以按任务组合使用。

## 需要浏览器里找线索，就用 easybrSearch

当问题还比较开放，比如“大家最近怎么讨论某个功能”，你可能想看多个网站、自媒体平台或代码项目，再挑几条真正相关的内容读一读。easybrSearch 是免费开源的 Skill 和本地 CLI，可以复用已经连接的浏览器，按指定平台搜索、筛选候选，再读取选中的页面。

它不会要求你另买一项 easyserp API 额度，也不会把搜索摘要冒充成已经读过的正文。浏览器能访问什么页面，取决于当前连接、登录状态和网站限制；遇到登录墙或验证就保留实际状态。它适合探索和阅读，不代表所有网站、账号或页面都一定可用。

源码：[GitHub](https://github.com/aiispower/easybrSearch) · [Gitee](https://gitee.com/xxjrq/easybrSearch)

## 需要结构化地搜 Google 或 Bing，就用 easyserp

如果你已经知道要查什么，希望每次都得到便于处理的搜索结果，easyserp 更合适。它支持 Google 与 Bing，可按域名限制或排除来源，并通过 Skill、CLI、MCP stdio 或 HTTP API 接入。普通使用可以直接安装 Skill 后用一句话发起搜索；只有要编写集成代码时，才需要看开发者接口。

服务支持 **2000 QPS**。在 [easyserp 控制台](https://serp.skyvora.cc)注册赠送 **1000 次搜索**，这是一次性额度，不是每月赠送；之后价格为 **¥2/1000 次**。搜索由托管服务按量计费，开源的是客户端、命令行、MCP 适配器和 Skill，并不代表云端搜索基础设施也开源。

搜索结果是候选线索：标题、链接和摘要能帮助你决定下一步读什么，却不能证明页面已经打开或内容已经核实。遇到仍在处理的请求，easyserp 会保留请求标识供后续查询，不把等待状态说成搜索失败或已完成。

## 两个工具如何配合

以“浏览器隐私接口最近有什么变化”为例，先用 easybrSearch 在用户指定的网站里找资料，挑出几条相关页面并阅读；整理出仍需确认的问题后，再用 easyserp 对 Google 或 Bing 发起明确查询。最终回答把“浏览器里读到的正文”和“搜索结果里的摘要线索”分别列清楚，需要引用的事实回到原页面核对。

这是一个可复用的流程示例，并非声称我们已经替读者完成了这项研究，也不代表每次都能找到相同结果。搜索范围、页面可读性和站点变化都会影响实际过程。

如果研究完成后还要继续做选题、内容制作和多平台发布，可以再了解 [aimeGeo](https://geo.aimmme.com/) 的相关工作流。它是可选的后续工具，不包含在 easybrSearch 或 easyserp 里。

简单来说：要跨站探索、浏览器里读页面，先看 easybrSearch；要重复调用 Google/Bing 并处理结构化结果，先看 easyserp。按问题选工具，往往比把所有需求塞进一个入口更清楚。

**开始体验 easyserp：** [打开控制台](https://serp.skyvora.cc)。
