# 邮件摘要：P2HHV32/P2HHV31 96CH LV 两种 O-ring 类型移液器老化测试对比总结

## 邮件标题

P2HHV32/P2HHV31 96CH LV Mold Oring 与 OTP-O ring 老化测试对比总结

## 邮件正文

各位好，

以下为两种 O-ring 类型移液器老化测试的最新对比总结。数据来源为 `96 LV PVT LIFETIME REPORT` 中的 `RD Lifetime test-96ch lv` 明细表与 `老化汇总表`，读取日期为 2026-06-16。统一规格口径为：CV QC 限值 4% / 客户限值 5%；最差通道 CV QC 限值 5.6% / 客户限值 7%。

总体来看，Mold Oring 类型本次纳入统计样本数量为 13 台，且 13 台均已完成至 392% 或 417%；其中 11 台建议 PASS，2 台存在 QC risk / 返修相关风险。OTP-O ring 类型样本数量为 5 台，但风险更集中，仅 2 台明确 PASS，另有 2 台 STOP/FAIL 与 1 台 QC risk，建议暂缓放行并完成 RCA 与复测后再判定。

## 1. Mold Oring 类型分析

- 样本数量：13 台
- 完成情况：13/13 完成至 392% 或 417%
- PASS / Risk / Hold：11 台 PASS，2 台 QC risk，0 台 HOLD/RUNNING
- 最大 CV：6.60%（P2HHV3120250407A01，379%）
- 最大最差通道 CV：55.15%（P2HHV3120250407A01，379%）
- 综合判定：PASS with risk notes

分析结论：Mold Oring 类型整体完成度明显高于 OTP-O ring。13 台均完成老化，其中多数机台的 CV 与最差通道 CV 满足规格要求，可按 PASS 方向推进。但该类型不能简单按全部通过处理，需要单独关闭 2 台风险机台。

重点风险机台如下：

- P2HHV3120250407A01：已完成 417%，但 302% 后出现 D2 漏液；379% 节点 CV 6.60%、最差通道 CV 55.15%，并有 Replace nozzle / Replace O-ring 相关记录。该机台建议作为 QC risk / rework risk 单独关闭。
- P2HHV3120250702A03：已完成 417%，但 340% 节点最差通道 CV 11.59%，并有 H3 low %D 备注；建议保留为 QC risk 并确认后续处理说明。

Mold Oring 归档建议：11 台正常完成机台可按 PASS 方向推进；上述 2 台需完成风险关闭、补充说明或复测后再归档。

## 2. OTP-O ring 类型分析

- 样本数量：5 台
- 完成情况：3/5 Finish，2/5 STOP/FAIL
- PASS / Risk / Fail：2 台 PASS，1 台 QC risk，2 台 STOP/FAIL
- 最大 CV：6.83%（P2HHV3220250627A02，175%）
- 最大最差通道 CV：3.45%（P2HHV3220250409A02，200%）
- 综合判定：HOLD / RCA

分析结论：OTP-O ring 类型风险显著高于 Mold Oring。该类型的主要问题不是最差通道 CV 普遍超限，而是吸液少、不吸液、泄漏率异常以及个别机台 392% CV 超 QC 风险。

关键异常如下：

- P2HHV3220250627A02：STOPED-(150%-175%)；175% 光学验证 CV 6.83%，记录 D3/G9 吸液少，已进入拆机/返修分析。
- P2HHV3220250627A03：stopped-(150%-175%)；50% E10 不吸液，150% CH19/CH58 泄漏率高，175% B7 不吸液体并 FAIL。
- P2HHV3220250701A01：虽然 Finish 并达到 392%，但 392% CV 为 4.16%，超过 4% QC 限值；同时有 H4 LOW %D 和 200 uL 泄漏率 23.46 pa/s 备注，建议判定为 QC risk。

OTP-O ring 归档建议：暂缓放行，不建议按完成老化通过归档。建议完成失效件拆解、吸液/泄漏 RCA、结构与装配复核，并对风险机台复测后再做最终判定。

## 综合建议

1. Mold Oring：整体可按 PASS with risk notes 方向推进，但需关闭 0407A01、0702A03 两台风险项。
2. OTP-O ring：建议 HOLD，完成 RCA、结构/装配复核和复测后再判定。
3. 归档前统一同步 `老化汇总表` 与 RD 明细表状态；对 392% plate4/plate5 #DIV/0!、315% 三盘验证范围、LOW %D、漏液/吸液异常和泄漏率备注形成统一说明。

综上，Mold Oring 当前整体表现优于 OTP-O ring，但仍需要风险项闭环；OTP-O ring 存在明确失效与质量风险，需暂停放行并完成进一步分析。

