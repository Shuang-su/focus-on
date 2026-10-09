# Linear preparation and routing

Spark 工作区分成 Development (`DEV`) 与 Focus On 收件箱 (`LIFE`)。DEV 是原 SPA Team 的改名，保留 Team UUID、既有任务和状态。LIFE 使用一个新的 Team 身份。具体接入 ID 与实际设置保存在私有 vault。

| Context | Repository | Behavior |
|---|---|---|
| DEV / Focus On — 基础建设 | public focus-on | 研发 Issue/PR 关联；用 `relates to DEV-n`，验收后完成任务 |
| LIFE / Focus On 收件箱 | private focus-on-vault | 私人录入请求；最终配置为一个原生双向 Issue 同步目标 |

LIFE 状态：待处理(backlog)、处理中(started)、待补充(started)、待合并(started)、待核验(started)、已入库(completed)、已取消(canceled)。合并先进入待核验；写入器读回 main 后才能回写已入库。待办、预购、地点与账目业务状态保存在数据文件。

GitHub 原生集成：仅追加明确仓库授权，保护已有授权；一个 Team 一个双向同步仓库。配置时关闭私人内容向公开仓库的 Linkbacks。普通 Team 对工作区成员可见，私有 vault 不等于 Linear 隐私隔离。

## Acceptance

1. 读回工作区、Team UUID/key、Project 和每个状态，检查只有 LIFE 指向私有 vault。
2. 用标记 synthetic 的录入请求在 LIFE 创建测试 Issue，确认私有 GitHub Issue 内容与标识。检查公开仓库没有该内容。
3. PR 关联后检查待合并/待核验；只有 main 内容读回一致后才能关闭录入请求。
4. 重试复用请求 ID；关闭录入请求不会改动生活任务状态。

原生同步和 writer 的实际开通分别记录。基础 CLI 没有写入/回写工具，录入闭环验收须在 writer 阶段完成。[Official GitHub integration](https://linear.app/docs/github)
