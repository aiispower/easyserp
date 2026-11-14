# 集成指南

## 标准 HTTP API

先设置环境变量 `EASYSERP_API_KEY`。下面的 Python 标准库示例直接读取环境变量，不会把 API key 放进进程参数；它会生成幂等键并在请求前打印，以便网络结果未知时恢复：

```python
import json
import os
import urllib.request
import uuid

key = os.environ["EASYSERP_API_KEY"]
idempotency_key = str(uuid.uuid4())
payload = {
    "engine": "google",
    "q": "renewable energy",
    "region": "US",
    "idempotency_key": idempotency_key,
}
print(f"Save idempotency key for recovery: {idempotency_key}", flush=True)
request = urllib.request.Request(
    "https://serp.skyvora.cc/api/v1/search",
    data=json.dumps(payload).encode(),
    headers={
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Idempotency-Key": idempotency_key,
    },
    method="POST",
)
with urllib.request.urlopen(request, timeout=35) as response:
    print(response.read().decode())
```

若响应未知，用相同幂等键和完全相同的 payload 重放。不要把 API key 写入 shell 历史、仓库或 URL。HTTP API 与 MCP 共用计量服务。

## Node.js SDK

本地开发时从本包 `src/client.mjs` 导入；发布 npm 包之后再按包名安装。构造客户端时可传入 `apiKey`、`baseUrl`、`timeoutMs`、`fetchImpl`。一般仅设置 `EASYSERP_API_KEY` 即可。请求和批处理字段见 [API 行为](API.md)。

## MCP stdio

MCP server 是本地 stdio 进程，由 MCP host 管理；目前不提供 remote MCP URL。将示例路径替换为 easyserp 安装目录的实际绝对路径。这里以 npm 安装目录 `/absolute/path/to/node_modules/easyserp` 为模板：

```json
{
  "mcpServers": {
    "easyserp": {
      "command": "node",
      "args": ["/absolute/path/to/node_modules/easyserp/src/mcp.mjs"],
      "env": {"EASYSERP_API_KEY_FILE": "/absolute/private/easyserp.key"}
    }
  }
}
```

把单行 API key 单独存入私有文件 `/absolute/private/easyserp.key`，限制权限为仅当前用户可读写（例如 Unix mode `0600`）；配置中只放文件路径，不放密钥本身。`EASYSERP_API_KEY_FILE` 由客户端从该文件读取。也可由 MCP host 的安全凭据功能提供 `EASYSERP_API_KEY`。一些 stdio host 只向子进程传递 allowlist 环境变量，因此先核对 host 的 env forwarding 行为；不要假设配置文件会插值环境变量。

工具：`easyserp_search`、`easyserp_batch_search`、`easyserp_request`、`easyserp_capabilities`。前三个搜索/请求工具需要 API key；`easyserp_capabilities` 无需 key，可用于查看 setup 和功能说明。搜索会产生按量计费。

### 发布后配置

`easyserp-mcp` 是 npm 包 `easyserp` 提供的 bin，不是单独的 npm 包。包发布且验证后，可用：

```sh
npx -y --package easyserp easyserp-mcp
```

标准 API、SDK、CLI 和 MCP 都连接 `https://serp.skyvora.cc`；没有 remote MCP endpoint。
