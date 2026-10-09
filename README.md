# 着眼 · Focus On

收集值得关注的信息，安排想做的事情，记录实际发生的生活。

本公开仓库保存产品代码、格式规范和合成测试资料。个人收藏、生活和财务记录保存在独立私有 `focus-on-vault`。当前交付是基础工具，尚未提供地图、应用界面、真实数据写入服务或后台自动采集。

## 开始使用

需要 macOS arm64 或 Linux x64/arm64、Git、Bash、curl、tar。安装占用项目本地缓存，不改变全局 Node 默认版本。

```bash
bash scripts/bootstrap.sh check
bash scripts/bootstrap.sh focus doctor
bash scripts/bootstrap.sh focus validate --vault examples/vault
bash scripts/bootstrap.sh focus plan --request examples/requests/create-task.json --vault examples/vault --out .codex-work/tmp/demo
```

Bootstrap 使用 Node 24.21.0、pnpm 10.18.3 和冻结的锁文件；Node 下载校验官方 SHA256。若环境已经配置同版本 Node/pnpm，可直接 `pnpm install --frozen-lockfile --store-dir .codex-work/cache/pnpm && pnpm check`。

`plan` 只输出变更计划、差异文件和 `planned` 回执。它不会写入数据仓库、创建 Issue/PR、确认账目或宣称正式入库。生成的新记录 ID由资料库 ID、请求 ID、输入版本和操作顺序确定。修改请求版本后需要生成相应新 ID；更新记录需匹配 revision 和完整资料库 snapshot。

公共接口：`CaptureRequest`、`ChangeSet`、`ProcessingReceipt`、`RecordData`。执行 `focus schemas` 导出 JSON Schema。格式版本为 1；当前仅支持财务草稿，confirmed 状态不在首轮写入能力内。

公开示例 manifest 的全零 validator SHA 是合成测试标记；正式私有资料库固定实际本体 commit，升级需单独验证。剪藏摘要与笔记可保存在按记录 ID 关联的 Markdown 中。

详见 [数据契约](docs/data-contract.md)、[本机/云端运行](docs/environments.md)、[Linear 配置](docs/linear.md)、[阶段路线图](ROADMAP.md)。本仓库尚未选择开源许可证。
