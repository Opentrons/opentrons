# 邮件摘要：P2HHV32 96CH LV 三种类型移液器老化测试对比总结

## 邮件标题

P2HHV32 96CH LV 三种类型移液器老化测试对比总结

## 邮件正文

各位好，

以下为 P2HHV32 96CH LV 三种类型移液器老化测试的对比总结，覆盖 Mold Oring Rework、Rod Seal、Mold Seal 三类样机。统一规格口径为：CV QC 限值 4% / 客户限值 5%；最差通道 CV QC 限值 5.6% / 客户限值 7%。

总体来看，Mold Oring Rework 与 Mold Seal 两类样机均完成 392% / 1,020,000 cycles，且达到 100% Finish / PASS；Rod Seal 类型出现 2 台 STOP/FAIL 与 1 台 QC risk，不建议直接按通过归档，建议 HOLD 并完成 RCA 与复测后再判定。

## 1. Mold Oring Rework 类型分析

- 样本数量：4 台
- Finish / PASS：4/4 Finish，4/4 PASS
- 最高进度：4 台均完成 392% / 1,020,000 cycles
- 最大 CV：0.825%
- 最大最差通道 CV：2.88%
- 综合判定：PASS

分析结论：Mold Oring Rework 是三类中光学表现裕量最好的类型。4 台样机均完成老化测试，所有可用 CV 与最差通道 CV 均低于规格限值，未见 STOP/FAIL 记录。建议按 PASS 方向归档。

注意事项：老化汇总表仍显示 238% running，需同步为 Finish / 392%；392% 节点 plate4/plate5 为 #DIV/0!，正式归档前建议补测或形成书面说明。0411A03 在 0% 节点有 high %D 备注，但后续 CV 数据仍在规格内。

## 2. Rod Seal 类型分析

- 样本数量：5 台
- Finish / PASS：3/5 Finish，2/5 PASS
- Risk / Fail：1 台 QC risk，2 台 STOP/FAIL
- 最大 CV：6.83%
- 最大最差通道 CV：3.45%
- 综合判定：HOLD / RCA

分析结论：Rod Seal 是三类中风险最高的类型，也是唯一出现 STOP/FAIL 与 QC risk 的类型。问题主要集中在吸液不足、不吸液、泄漏/泄漏率异常，以及 392% CV 风险，并非最差通道 CV 普遍超限。

关键异常包括：P2HHV3220250627A02 在 175% 节点 CV 达到 6.83%，并伴随 D3/G9 吸液少记录；P2HHV3220250627A03 在 150%-175% 区间停止/失败，记录包括 E10/B7 不吸液、CH19/CH58 泄漏率高；P2HHV3220250701A01 虽然 Finish，但 392% CV 为 4.16%，且有 H4 LOW %D 与泄漏率备注，因此判定为 QC risk。

建议：Rod Seal 类型暂缓放行，不建议按完成老化通过归档。建议完成失效件拆解、吸液/泄漏 RCA、结构与装配复核，并对风险机台复测后再做最终判定。

## 3. Mold Seal 类型分析

- 样本数量：5 台
- Finish / PASS：5/5 Finish，5/5 PASS
- 最高进度：5 台均完成 392% / 1,020,000 cycles
- 最大 CV：0.86%
- 最大最差通道 CV：3.04%
- 综合判定：PASS

分析结论：Mold Seal 类型整体表现稳定，5 台样机均完成 392% 老化测试，现有 CV 与最差通道 CV 均满足规格要求。虽然个别机台存在 LOW %D 或三盘验证范围备注，但未造成 CV 超限或 STOP/FAIL 结论。建议按 PASS 方向归档。

注意事项：老化汇总表仍显示 200% running，需同步为 Finish / 392%；392% 节点 plate4/plate5 为 #DIV/0!；部分 315% 记录注明使用新验证且仅测试 3 盘，需在归档时说明统计范围。

## 综合建议

1. Mold Oring Rework：建议 PASS，按通过方向归档。
2. Mold Seal：建议 PASS，按通过方向归档。
3. Rod Seal：建议 HOLD，完成 RCA、结构/装配复核和复测后再判定。

归档前建议统一完成以下动作：

- 同步老化汇总表状态，确保与 RD Lifetime 明细表一致。
- 对 392% plate4/plate5 #DIV/0! 的数据范围形成统一复测或书面说明。
- 保留所有 LOW %D、吸液少、不吸液、泄漏率异常和三盘验证范围备注，作为后续 RCA 与归档依据。

综上，三类对比结果显示 Mold Oring Rework 与 Mold Seal 当前满足老化测试通过条件；Rod Seal 存在明确失效与质量风险，需暂停放行并完成进一步分析。
