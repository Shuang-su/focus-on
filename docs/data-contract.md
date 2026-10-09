# Data contract v1

`src/contracts.ts` 是格式与 TypeScript 类型的共同来源。`focus schemas` 输出 manifest、record、captureRequest、changeSet 和 processingReceipt JSON Schema。共享字段为 schemaVersion、id、revision、title、createdAt、updatedAt、source、links；时间为带时区 ISO 8601。

支持 collection、note、task、plan、wishlist、finance_draft、entity、budget、subscription、attachment。结构化记录为 JSON，正文为关联 Markdown。原始请求以受控 JSON 保存在 inbox/requests，不能直接作为 shell、路径或 workflow 指令。

正式记录按 ID 关联。财务金额为非负安全整数 amountMinor、ISO 币种代码与 precision；类型区分 expense/income/transfer/refund。转账需要两个不同账户引用，退款需要原交易引用。首轮只接受 pending 草稿，不计算真实余额或自动确认。

验证读取 collections、notes、life、finance、entities、attachments-manifest 的 JSON，检查重复 ID、引用、版本及附件。读到 symlink 或越界路径即失败。snapshot 由 manifest、记录和被引用正文/已保存附件内容共同计算，跨操作系统一致。

请求保留 input.text 原文并固定 baseSnapshot。create ID 为 `rec_` + SHA256(vaultId + ':' + requestId + ':' + inputVersion + ':' + operationIndex) 的前24位。update 保持 ID、kind、createdAt，使用 expectedRevision 和 revision+1。请求重试复用 ID、分支、inputHash；变更基准变化则重新核对，不覆盖。使用原 --out 目录重试会自动读取原 ChangeSet，检测相同版本的输入变更；另一台机器应传 --previous 原 change-set.json。首次处理前必须保存请求版本，不能在跨机器交接中丢弃前次计划。

ChangeSet 包含相对数据路径、beforeHash/afterHash 和候选记录。ProcessingReceipt 的 planned/awaiting_merge/stored 等表示处理状态，stored 需要真实合并和读回证据。基础 planner 只生成 planned/verified=false；文件副本与附件写入由后续受控 writer 提供。
