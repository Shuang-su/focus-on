# Foundation checkpoint

实现统一契约、Node 24 bootstrap、doctor/validate/plan、12 条合成记录及小型附件、锁文件、Linux CI、云端交接与 Linear 配置说明。

本机初步验证：17 项测试通过，合成资料库 12 条记录通过；snapshot 为 `801caa0c67dc26ccaf061b08fcfa75dd328d90b67911af5cf55d921b2e52cdce`。初次类型推导错误已修复，恢复测试改用独立临时目录。

本次 checkpoint 仍需远端读回、Linux CI、全新克隆恢复与实际云端取回验证，最终证据将在后续 checkpoint 更新。私人接入标识与完整原始请求仅保存在私有 vault。

限制：planner 生成结构化候选变更，不写正式数据、不提交 PR、不将回执标记 stored；新增 Markdown 正文及附件写入由后续 writer 实现。跨机器重试必须带回此前 ChangeSet 才能检测未升版输入变化。

后续 checkpoint f970ae73c02da95fbf461f3f85e5a8b9d3322ce8 增加已保存请求版本核对，18 项本机测试通过。

实际 Work Cloud 首轮在 176f1d50d1691f550733a8f54c86b7b66b00be26 完成 17 项测试、doctor、validate 与两次 plan，返回文件与 Mac/Linux CI 字节相同。首次冷启动 tar 恢复所有权失败，重试成功。修复使用 --no-same-owner，并加完整安装标记；CI 增加固定运行时冷启动路径。修复后实际云端冷启动复测仍需独立证据。
