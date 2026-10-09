# Foundation completion record

2026-10-09：公开本体与私有资料库已建立，统一运行基础已验证，Linear 配置材料就绪。修复版实际 Work Cloud 冷启动仍待网络条件验收；本轮不以 Linux CI 代替该证据。

## 实际变更

统一 JSON Schema 与派生 TypeScript 类型，提供 CaptureRequest、ChangeSet、ProcessingReceipt；实现 doctor、validate、plan，固定 Node 24.21.0、pnpm 10.18.3 与锁文件。校验覆盖记录格式、唯一 ID、引用、金额、版本、Markdown 与附件字节/哈希。planner 保留业务状态、生成稳定 ID、检测请求输入及基准冲突，输出可审查计划和差异。

公开测试资料为 12 条合成记录、两份 Markdown 和一份小型文本附件。公开 manifest 的全零 SHA 仅是合成测试标记，正式私有 vault 固定实际验证器 SHA。公共 CI、示例和变更记录使用合成或脱敏内容；未添加许可证。

## 验证证据

- Mac arm64：18 项测试及 doctor/validate/plan 通过。公开示例 snapshot 为 `801caa0c67dc26ccaf061b08fcfa75dd328d90b67911af5cf55d921b2e52cdce`。
- Linux x64：18 项测试及强制下载/解压固定运行时的冷启动通过，[CI 37874680483](https://github.com/Shuang-su/focus-on/actions/runs/37874680483)。Mac/Linux 的 ChangeSet 与 receipt 字节相同。
- 真实 Work Cloud：初始版本完成 17 项测试、doctor、validate 及两次 plan，取回文件与 Mac/Linux 字节相同。首次 tar 所有权恢复失败、重试成功；已修复为 --no-same-owner，并仅在完整安装成功后写标记。修复版全新克隆被执行工具网络策略阻止访问 GitHub，冷启动复测未执行。
- 全新克隆：固定本体版本重新安装依赖，18 项测试通过；恢复合成私有资料库的记录数量、snapshot、引用及附件哈希一致。
- 两个远端的初始可见性、默认 main、commit 与完整文件树已读回匹配。完整私人证据只保存在私有 vault。
- Linear Team 设置、7 个请求状态及配置检查通过。按用户最新选择，名称 Focus On、key FOCUS；DEV 的双向目标准备为 Metaflow，FOCUS 为私有 vault，公开本体使用 PR 关联或 GitHub → DEV 单向 Issue 同步。原生 Issue 同步尚未启用，实际路由测试待后续验收。

## Checkpoints

- 初始化：`176f1d50d1691f550733a8f54c86b7b66b00be26`。
- 保存请求版本核对：`f970ae73c02da95fbf461f3f85e5a8b9d3322ce8`，18 项测试通过。
- 云端 archive 所有权修复与安装标记：`3ca8802bc4b857052994e5beaf85b57151d783b8`；正式 vault 固定此验证器版本。

## 已知限制与剩余验收

plan 生成结构化候选，不写正式记录、不创建 PR、不把 receipt 标记 stored。新增 Markdown 正文、附件保存与正式 writer 在下一阶段；真实财务只允许后续专门验收。已保存请求同版本的输入哈希会核对，跨机器交接可再提供 --previous ChangeSet。

实际云端修复版冷启动、GitHub App 所选仓库范围、原生 Issue 同步和合并读回闭环仍待验收。持续 MCP Events/Dots 调度、地图、设计检索、应用界面已拆成后续任务。安装和缓存保持项目内，预算 1 GiB；Mac 的全局 Node 默认版本未改变。
