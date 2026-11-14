# easyserp 与 easybrSearch 发布记录

核对日期：2026-11-14。提交成功、等待审核、公开上架分别记录；一个平台的回执不代表其他平台已上架。

| 渠道 | easyserp | easybrSearch |
| --- | --- | --- |
| GitHub 源码 | [公开仓库](https://github.com/aiispower/easyserp) | [公开仓库](https://github.com/aiispower/easybrSearch) |
| GitHub 版本下载 | [1.0.0](https://github.com/aiispower/easyserp/releases/tag/v1.0.0)：Skill ZIP、Claude 插件 ZIP、独立 MCPB、可选 Node 包、SHA256 | [1.0.3](https://github.com/aiispower/easybrSearch/releases/tag/v1.0.3)：Skill ZIP、SHA256 |
| Gitee | [源码与 v1.0.0 版本说明](https://gitee.com/xxjrq/easyserp) | [源码与 v1.0.3 版本说明](https://gitee.com/xxjrq/easybrSearch) |
| Claude Code 自有 marketplace | `easyserp@easy-search-tools` 1.0.0 实际安装并启用 | `easybr-search@easy-search-tools` 1.0.3 实际安装并启用 |
| MCP 官方目录 | [1.0.0 公开记录](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.aiispower%2Feasyserp/versions/1.0.0)：HTTP 200，active，isLatest=true | 浏览器 Skill；本轮没有申报为 MCP server |
| agentskill.sh | GitHub 导入成功，待目录审核 | GitHub 导入成功，待目录审核 |
| mcpservers.org | 免费投稿成功，待审核；页面提示两周内审核 | 本轮未作为 MCP server 投稿 |
| ClawHub | 一次提交尝试；回读为 pending.publication，未取得精确版本回执，未重试 | 保留原有历史发布记录；本轮新版本尚未确认 |
| SkillHub | `easyserp-search` 1.0.0 已提交，安全审核中 | `easybr-search` 1.0.3 更新已提交，安全审核中；上一已上架版本为 1.0.2 |
| Claude 官方精选目录 | 入口跳转为地区不可用，未投稿；与自有 marketplace 安装分开记录 | 同左 |
| npm | 按用户要求优先完成其他渠道；未发布 npm 包 | 本轮未发布 npm 包 |

SkillHub 本轮共 **2 项提交成功，2 项安全审核中，0 项新版本已通过审核得到确认**。原 easybrSearch 1.0.2 的已上架记录保留。

Gitee 已同步源代码、版本标签与版本说明。二进制下载链接指向 GitHub Releases，本轮没有声称 Gitee 已托管同一批二进制附件。两个 GitHub 账号的既有配置保留，新项目使用 aiispower，Gitee 使用 xxjrq。

Glama、LobeHub 的导入入口均停在 GitHub 登录页，未完成投稿；未向第三方提供仓库发布令牌。更多候选渠道的路线见 [MARKETPLACE.md](MARKETPLACE.md)。付费收录未购买；自动索引未确认的目录不计为已上架。

## 安装入口

```sh
claude plugin marketplace add aiispower/easyserp
claude plugin install easyserp@easy-search-tools
claude plugin install easybr-search@easy-search-tools
```

Claude Desktop 或兼容客户端可从 easyserp 1.0.0 发布页下载 `.mcpb`，按 [MCPB 说明](MCPB.md)导入并配置自己的 API key。控制台与注册入口：[serp.skyvora.cc](https://serp.skyvora.cc)。

## 验证

- easyserp 37 项、easybrSearch 95 项自动化测试通过。
- easyserp 的五个公开下载包全部匿名下载成功，字节 SHA256 与本地冻结包一致；easybrSearch 1.0.3 Skill ZIP 同样核对通过。
- Node 包从仓库外临时目录安装后，CLI 与 MCP 协议检查通过；独立 MCPB 在仓库外、清空 NODE_PATH/NODE_OPTIONS 后初始化、工具发现和免密能力查询通过。
- 两款 Claude Code 插件在独立配置目录从公开 marketplace 实际安装并启用。
- MCP 官方目录经 [GitHub Actions 发布](https://github.com/aiispower/easyserp/actions/runs/43571915397)成功；公开记录的 MCPB 地址与哈希匹配冻结包。
- 12 个真实搜索样例中，11 个收到 API 返回，1 个重试后终态不可用；5 个有可用的限定来源结果。严格来源筛选后出现空结果的样例保留空集与提示，未混入范围外结果。这是接入样例，不是准确率或性能基准。详情见 [VERIFICATION.md](VERIFICATION.md)。

## 自媒体文章与配图

以下均已写好，状态为待发布稿，尚未发布到自媒体平台：

- [产品组合介绍：公众号、头条](promotion/01-search-family.zh.md)
- [Claude/Codex 搜索接入教程：知乎、掘金、CSDN](promotion/02-claude-codex-search.zh.md)
- [小红书、微博与英文发布短文案](promotion/03-platform-copy.zh.md)

文稿包含两款产品的 GitHub/Gitee 地址、注册及 API key 引导、Claude 安装命令和相应用法。easyserp 蓝紫图标、easybrSearch 现有图标及产品组合宣传图均已落库；easyserp 的产品属性为 2000 QPS、注册一次赠送 1000 次、后续 ¥2/1000 次。easybrSearch 免费独立使用。

SkillHub 对无扩展名 `LICENSE` 的拒绝已修复：专用兼容包改用 `LICENSE.md`，MIT 文本和运行脚本不变；easyserp 兼容包还移除了一条会被 PNG 剔除规则影响的重复本地图标引用，保留公开图片地址。兼容包及其独立 SHA256 已补充到两个 GitHub 版本页，原始冻结包保留。

旧版本、冻结包与渠道回执保留；平台结果未知时先回读，不重复提交同一版本。
