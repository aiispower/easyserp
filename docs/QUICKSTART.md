# 快速开始 / Quickstart

## 1. 创建账户和密钥

打开 [easyserp 控制台](https://serp.skyvora.cc)，选择注册，完成注册后进入 **API keys** 创建密钥。该控制台根页面已核验可访问；没有单独注册深链。将密钥放在环境变量，不要放入脚本参数、查询 URL、聊天记录或代码仓库。

```sh
export EASYSERP_API_KEY='你的密钥'
```

这是最简单的账户接入方式。服务支持 2000 QPS；注册赠送 1000 次搜索（一次性，不是每月），之后 ¥2/1000 次。普通用户可直接安装并调用本目录中的 Skill，不必先阅读 SDK 文档。

Windows PowerShell 当前会话：

```powershell
$env:EASYSERP_API_KEY = '你的密钥'
```

SDK 也接受 `SERP_API_TOKEN`，但推荐统一用 `EASYSERP_API_KEY`。未指定时，API base 是 `https://serp.skyvora.cc`。

## 2. 从本地源码运行

Node.js 20+，在包根目录运行：

```sh
npm install
node src/cli.mjs search "AI regulation" --engine google --region US --format markdown
```

JSON 输出：

```sh
node src/cli.mjs search "AI regulation" --engine bing --region GB --format json
```

结果默认会进行有界的恢复、去重和相关性整理。需要限制来源时可重复添加域名参数：

```sh
node src/cli.mjs search "browser privacy API" --engine google --include-domain developer.mozilla.org --include-domain w3.org
```

CLI 默认最多尝试三次，并在有限时间内结束；它会保留请求与恢复信息。遇到仍在处理的请求时，用其 request ID 查询状态，不会把 pending 当作失败后另起一次搜索。

批量请求文件为最多 100 个对象的 JSON 数组：

```json
[
  {"q":"AI regulation","engine":"google","region":"US"},
  {"q":"AI regulation","engine":"bing","region":"GB"}
]
```

```sh
node src/cli.mjs batch ./queries.json --concurrency 4
```

## 3. 发布后安装

以下仅是包发布后的预期用法。发布完成前，请使用上一节的本地 Node 命令；没有已确认的 npm 包时，不要运行未发布的 `npx` 名称。

```sh
npx -y --package easyserp easyserp search "AI regulation" --engine google --region US
```

## 4. 处理待完成请求

HTTP 202 或 504 中的 `request_pending`，且状态为 `queued` 或 `running`，表示请求仍在结算中，不代表失败、退款或成功。记录回执的 `request_id` 和 `idempotency_key`。需要查看进度时：

```sh
node src/cli.mjs request REQUEST_ID
```

如客户端遇到超时或连接中断导致结果未知，用**相同幂等键和完全相同的请求参数**安全重放原请求。不要仅因超时就换幂等键重发；这可能创建另一笔请求。默认没有自动轮询或自动网络重试。确认失败后释放预留额度；成功请求扣一次搜索费用。只有搜索结果成功后才计费。

若要主动重试 429，请先遵守响应的 `Retry-After`；客户端默认不自动重试。请求查询 `GET /api/v1/requests/{id}` 需要 requests scope。

## 5. 产品与使用提示

服务支持 2000 QPS。注册赠送 1000 次搜索，为一次性额度，不是每月额度；后续 ¥2/1000 次。批量并发参数控制客户端同时发出的任务数，不改变产品计量规则。

如果任务需要浏览器登录态下跨网站找资料、搜索自媒体或阅读已选网页，可试用免费的 [easybrSearch](https://github.com/aiispower/easybrSearch)（[Gitee](https://gitee.com/xxjrq/easybrSearch)）。它不需要 easyserp API key，也不含 easyserp 搜索额度。两者可配合使用，但各自独立。
