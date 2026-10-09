# Effective implementation plan

1. 建立公开 focus-on 与私有 focus-on-vault 两个平级仓库，各自 main 分支、工作规范、请求/计划/完成记录与 checkpoint。私有 manifest 固定本体验证器完整 commit SHA；升级单独审核。
2. 使用 Node 24、pnpm 10 锁文件、TypeScript 与 AJV。共享 CaptureRequest、ChangeSet、ProcessingReceipt、记录和 manifest 的 schema/types。JSON 保存结构化记录，Markdown 保存正文，稳定 ID 关联。
3. doctor 检查运行时、目录、Git 与空间；validate 检查格式、ID、引用、请求版本、附件大小与 SHA256；plan 生成只读候选变更、差异和 planned 回执。重复请求稳定，输入同版本变化与记录/资料库版本冲突必须失败。
4. 首轮财务只有 pending 草稿；整数最小货币单位带币种/精度，预算、预购、消费、转账、退款分别表达。已保存附件必须有本地字节证据。使用小型合成附件。
5. Mac 与 Linux CI 使用相同 bootstrap/check/validate/plan。分别记录实际云端任务的运行和本机取回；未获得云端结果时保留待验收。以全新克隆验证固定版本与示例恢复。
6. Linear 研发沿用原 Team 身份，名称 Development、key DEV；新增 Focus On Team、key FOCUS，项目 Focus On — 基础建设。DEV 双向目标保留 Metaflow；FOCUS 双向目标为私有 vault。公开本体研发以 PR 关联或 GitHub 向 DEV 单向同步处理，非默认仓库 Issue 从 GitHub 发起。处理状态与生活/财务业务状态独立。准备路由、三类模板、同步检查与失败恢复；只有正式数据读回后才标记已入库。
7. 下一阶段拆为受控写入闭环、地图、设计检索、应用界面和事件/调度，分别定义验收。

缓存、下载、构建、交接输出使用项目 .codex-work，由 Git 本地 exclude 忽略。公开测试和记录仅含合成或脱敏内容。本轮不创建许可证。
