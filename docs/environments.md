# Local / cloud handoff

Mac、Linux CI、Codex/Work/Dots 各自克隆工作副本，使用相同 bootstrap 和显式 vault 参数。不要同步 SQLite 文件、node_modules、凭据或运行时缓存。

研发云任务只需要本公开仓库与 examples/vault。个人数据任务应通过之后的受限工具返回本次需要的内容；GitHub 仓库访问本身没有目录级权限隔离，不能靠提示词实现财务隔离。

## Cloud task input

输入固定 repository=Shuang-su/focus-on、commit SHA、request=examples/requests/create-task.json、vault=examples/vault。执行：

```bash
bash scripts/bootstrap.sh check
bash scripts/bootstrap.sh focus plan --request examples/requests/create-task.json --vault examples/vault --out .codex-work/tmp/handoff
```

返回 change-set.json、receipt.json、测试摘要和所运行 commit SHA。本机重算并比较 requestId、inputHash、baseSnapshot、branch、afterHash。不要把容器里的绝对路径作为数据契约。

GitHub Actions 的 Linux 验证与 Codex/Dots 实测分别记录。后者需要真实任务链接与取回内容；授权或云入口尚未就绪时标待验收。

旧 Codex Cloud 可使用 setup/maintenance scripts、固定 Node 版本和网络设置；Work/Dots 按实际账户入口测试。官方资料：[Cloud](https://learn.chatgpt.com/docs/environments/cloud-environment)、[Dots tasks](https://learn.chatgpt.com/docs/dots/tasks-and-memory)、[MCP Events](https://developers.openai.com/plugins/build/mcp-events)。固定周期需要已保存调度；Events 需要持久订阅服务。本轮没有常驻服务器或自动监控。
