---
status: ready_for_review_not_posted
channels: [公众号, 头条]
content_type: product introduction
---

![easyserp 与 easybrSearch 产品组合图](../../assets/easy-search-family-banner.png)

# 做资料研究，浏览器搜索和 API 搜索怎么选

想研究一个新题目，常常要先找不同网站的线索，再打开页面看细节；进入整理阶段后，又希望搜索结果能按固定格式交给程序处理。这两件事都和搜索有关，使用的入口却不一样。easybrSearch 和 easyserp 分别负责这两种工作，可以单独用，也可以接着用。

## 先跨站找线索、再读页面：easybrSearch

easybrSearch 是免费的浏览器研究 Skill 和 CLI。它复用已经连接的浏览器，可在浏览器能访问的平台中搜索；你可以挑选结果，再让 Agent 打开页面读取。它适合问题还比较开放、需要跨站比较，或想从媒体和代码项目中找线索的场景。使用它不需要 easyserp API key，也不消耗 easyserp 搜索额度。

例如，想了解“其他模型如何制作类似的代码动画”，可以先用 easybrSearch 在指定平台找相关页面，挑几篇读过的材料，再把仍未弄清楚的问题记下来。浏览器登录状态和网站访问限制会影响页面能否打开；搜索卡片或摘要只是线索，结论应回到实际读过的来源核对。

源码：[GitHub](https://github.com/aiispower/easybrSearch) · [Gitee](https://gitee.com/xxjrq/easybrSearch)

## 需要结构化的 Google 或 Bing 结果：easyserp

easyserp 提供 Google 和 Bing 搜索 API，可按域名限制或排除来源，并通过 Skill、CLI、本地 MCP 或 HTTP API 使用。它适合查询明确、需要重复调用，或要把结果交给后续程序处理的场景。普通用户可以从 Skill 开始；写代码接入时，再看 CLI、MCP 或 API。

服务支持 **2000 QPS**。在 [easyserp 控制台](https://serp.skyvora.cc)注册并创建 API key，会获得一次性的 **1000 次搜索额度**；之后为 **¥2/1000 次**。托管搜索服务按量计费，开源范围是客户端、CLI、MCP 适配器和 Skill。

继续前面的动画例子：把浏览器里读到的材料和待确认的问题整理出来，再用 easyserp 查询“开源模型 代码动画 生成方法”，需要时把结果限定在指定网站。搜索返回的标题、链接和摘要可用于定位候选；需要引用的事实，仍要打开原始页面核对。

源码：[GitHub](https://github.com/aiispower/easyserp) · [Gitee](https://gitee.com/xxjrq/easyserp)。前往 [GitHub v1.0.0 发布页](https://github.com/aiispower/easyserp/releases/tag/v1.0.0)下载 easyserp Skill 和 CLI ZIP。

## 从哪里开始

先到[控制台注册并创建 API key](https://serp.skyvora.cc)。只想跨站浏览和读页面，可以从 easybrSearch 开始；需要稳定调用 Google/Bing 搜索，再配置 easyserp。两者各自独立，按手头的问题选择即可。
