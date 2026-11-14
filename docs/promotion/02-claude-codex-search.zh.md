---
status: ready_for_review_not_posted
channels: [知乎, 掘金, CSDN]
content_type: developer workflow
---

![easyserp 图标](../../assets/easyserp-icon.png)

# 在 Claude Code 和 Codex 中开始搜索：easyserp 与 easybrSearch

做代码研究、比较工具或整理资料时，通常先要发现值得看的页面，再针对具体问题补充结构化搜索。easybrSearch 与 easyserp 可以接在同一条工作流里：前者使用浏览器搜索并阅读页面，后者调用 Google 或 Bing，返回便于筛选和处理的结果。

## Claude Code：添加 marketplace，安装两个插件

easyserp 的 Claude 插件包含 Skill；easybr-search 插件提供 easybrSearch Skill。安装前确认已安装 Claude Code，然后在终端依次运行：

```sh
claude plugin marketplace add aiispower/easyserp
claude plugin install easyserp@easy-search-tools
claude plugin install easybr-search@easy-search-tools
```

首次使用 easyserp 前，到 [serp.skyvora.cc](https://serp.skyvora.cc) 注册并创建 API key。服务支持 **2000 QPS**，注册赠送一次性的 **1000 次搜索**，后续为 **¥2/1000 次**。在启动 Claude Code 的终端环境中配置 `EASYSERP_API_KEY`，不要把密钥粘贴进聊天或写进项目仓库。easybrSearch 不需要 easyserp API key，也不消耗这项搜索额度。

如果只想试装 easyserp 的本地 MCP Bundle，可从 [GitHub v1.0.0 发布页](https://github.com/aiispower/easyserp/releases/tag/v1.0.0)下载 `.mcpb` 并导入 Claude Desktop。Skills 方案适合直接在 Claude Code 对话里使用；MCP Bundle 则作为 Claude Desktop 的本地 stdio 扩展运行。

## Codex 或其他支持 Agent Skills 的环境

easyserp Skill 位于仓库的 `skills/easyserp` 目录；easybrSearch Skill 随其独立仓库提供。按当前宿主的 Skill 安装方式添加对应目录，再配置 easyserp 的 `EASYSERP_API_KEY`。可从 [easyserp GitHub](https://github.com/aiispower/easyserp) 或 [Gitee](https://gitee.com/xxjrq/easyserp) 获取源码；easybrSearch 提供 [GitHub](https://github.com/aiispower/easybrSearch) 和 [Gitee](https://gitee.com/xxjrq/easybrSearch) 镜像。

## 一个具体工作流

假设要找“其他模型如何制作类似的代码动画”。先让 easybrSearch 在指定平台中找候选，再挑少量页面实际打开阅读。把读到的内容和仍待确认的问题分开记录，例如某个实现方法是否有公开说明。接着用 easyserp 查询更明确的问题，并按需要限制来源域名：

```sh
node src/cli.mjs search "开源模型 代码动画 生成方法" \
  --engine google \
  --include-domain github.com \
  --format markdown
```

这条命令从 easyserp 项目根目录运行，需要当前终端已配置 API key。它返回搜索结果和来源链接，不会替你读取页面正文。若引用结论，打开对应来源并核对实际内容；没有打开的结果保留为搜索线索。easyserp 会对返回链接执行域名筛选，若范围内没有结果，会显示空结果提示，不会把范围外链接说成匹配来源。

遇到请求仍在处理时，保留回执里的 request ID，查询原请求状态；不要仅因等待就换 key 另发一笔。批量搜索适合多个彼此独立、确有需要的问题，搜索按查询计量。

easyserp 与 easybrSearch 是两个独立项目：前者提供托管的 Google/Bing 搜索 API，开源客户端、Skill、CLI 和 MCP 适配器；后者提供免费的浏览器搜索与页面阅读 Skill/CLI，不收 easyserp 搜索费用。浏览器登录状态和站点访问限制会影响页面读取。安装说明和功能详情见两个仓库的 README 与 Skill 文档。
