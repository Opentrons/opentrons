# 邮件摘要：P2HHV32 96CH LV 移液器老化测试总结

## 邮件标题

P2HHV32 96CH LV Mold Oring Rework 移液器老化测试总结

## 邮件正文

各位好，

以下为 4 台 P2HHV32 96CH LV Mold Oring Rework + Peek collar + Top Peek collar + 10448-Hard Stop 移液器的老化测试总结。

根据最新 `RD Lifetime test-96ch lv` 详细记录，4 台样机均已完成至 392%（1,020,000 cycles），状态均为 Finish。所有可用光学 CV 与 worst channel CV 数据均低于规格限值；详细表未记录 total fail、failed channels 或 fail analysis。因此，综合判定 4 台样机老化测试通过。

需要注意：`老化汇总表` 仍显示 238%（620,000 cycles），建议同步更新为 Finish / 392%。另外，392% 光学数据中 plate4、plate5 显示为 `#DIV/0!`，正式归档前建议补测或书面说明该节点按前三板可用数据统计。

## 每台移液器总结

### 1. P2HHV3220250401A03

- 测试状态：Finish
- 最高进度：392%（1,020,000 cycles）
- 最新光学记录日期：2026-06-12
- 最大 CV across all dispenses：0.566%
- 最大 worst channel CV：1.01%
- 结论：光学 CV 表现稳定，所有可用 CV 数据均低于规格限值；未见失效记录，老化测试通过。
- 备注：392% 节点 plate4、plate5 为 `#DIV/0!`，需按统一口径补充说明或补测。

### 2. P2HHV3220250408A02

- 测试状态：Finish
- 最高进度：392%（1,020,000 cycles）
- 最新光学记录日期：2026-06-12
- 最大 CV across all dispenses：0.492%
- 最大 worst channel CV：1.41%
- 结论：整体 CV 水平较低，worst channel CV 也明显低于规格限值；未见失效记录，老化测试通过。
- 备注：392% 节点 plate4、plate5 为 `#DIV/0!`，需按统一口径补充说明或补测。

### 3. P2HHV3220250410A07

- 测试状态：Finish
- 最高进度：392%（1,020,000 cycles）
- 最新光学记录日期：2026-06-12
- 最大 CV across all dispenses：0.724%
- 最大 worst channel CV：1.60%
- 结论：200% 与 315% 节点 CV 略高于另外两台低值样机，但仍远低于 4% QC 规格；未见失效记录，老化测试通过。
- 备注：392% 节点 plate4、plate5 为 `#DIV/0!`，需按统一口径补充说明或补测。

### 4. P2HHV3220250411A03

- 测试状态：Finish
- 最高进度：392%（1,020,000 cycles）
- 最新光学记录日期：2026-06-12
- 最大 CV across all dispenses：0.825%
- 最大 worst channel CV：2.88%
- 结论：该样机的最大 CV 和最大 worst channel CV 是 4 台中最高，但仍低于 1ul CV QC spec 4% 和 worst channel CV QC spec 5.6%；后续节点未见超规格趋势，老化测试通过。
- 备注：0% 节点记录 `B4 F2 F6 high %D trial 2 3 4`，但后续可用 CV 均在规格内。392% 节点 plate4、plate5 为 `#DIV/0!`，需按统一口径补充说明或补测。

## 邮件结论

综上，4 台 P2HHV32 96CH LV Mold Oring Rework 样机均完成至 392% 老化测试，详细表状态为 Finish，且所有可用 CV 数据均满足规格要求。建议判定老化测试通过。请在正式归档前同步更新 `老化汇总表`，并补充 392% 节点 plate4、plate5 缺失数据的处理说明。
