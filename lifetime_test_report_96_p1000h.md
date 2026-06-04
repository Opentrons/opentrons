# P1KH 96-Channel P1000H Lifetime Test Report

报告日期：2026-06-03  
数据源：Google Sheet `Life Time Report -96 P1000H`，包含主寿命表、Test Plan、5 个 Pressure 汇总页，以及表内引用的 Google Sheets / Drive 链接。  
样本数量：5 台 production pipette  
测试类型：1000 uL cycles  
测试起始日期：2025-11-14  
最新主表记录：1,020,000 cycles，约 3.923x life / 392.3%

## 1. 数据范围与判定口径

本报告分析了：

- 主表 `RD Lifetime test-96ch P1KH`：5 台样机的 cycle、% Life、CV、PASS/FAIL、备注、失败通道、光学/压力链接。
- `Test Plan`：计划节点与实际完成日期，表内备注要求“继续跑到 fail 为止”。
- 5 个内嵌 Pressure 汇总页：每台样机在 125%、150%、175% 节点的压力值和 96 通道 leak-rate 矩阵。
- 主表引用链接：共识别 82 个去重链接，其中 57 个 Google Sheets 链接、25 个 Drive 图片/附件链接。重点读取了后段 720k 单页 Pressure Test 链接和 920k 多轮 Pressure Summary 链接。

注意：主表中未看到明确的光学 CV pass/fail 规范阈值，因此光学部分按表内显式 FAIL、异常备注、CV 趋势和异常高值进行工程判断。920k 外链 Pressure Summary 给出了明确阈值：Insert pressure min >= 500 Pa，Holding 1 uL max <= 2.45 Pa/s，Holding 50 uL max <= 0.88 Pa/s，Holding 200 uL max <= 3.07 Pa/s。

## 2. 总体结论

当前不能判定整组样机 lifetime PASS。主表状态仍显示 `Running-(200%-238%)`，但实际最新数据已到 392.3%，且 Test Plan 备注为继续运行至 fail。更重要的是，920k 外链 Pressure Summary 显示 5 台中 4 台压力 QC 为 FAIL，只有 `P1KHV3620250624A01` 在 920k pressure summary 中为 PASS。

建议当前报告结论定义为：测试仍在进行，但样机组已出现多项压力泄漏和光学/吸水异常；需优先复测 920k pressure FAIL 项，并更新主表状态与链接溯源后，才能做最终 lifetime 判定。

## 3. 样机级寿命与光学摘要

| Pipette | 最新 cycles | 最新 life | 最新 CV across all dispenses | 最新 worst-channel CV | 主表关键异常 | 初步判定 |
|---|---:|---:|---:|---:|---|---|
| P1KHV3620250624A04 | 1,020,000 | 392.3% | 4.379 | 1.585 | 100k F1 low %D；260k A5 low %D；520k 出现漏油、背板有油、传感器报错，且 CV 5.642 / worst 11.204；1020k 只测 3 盘 | 需复测光学并检查漏油/传感器事件，920k pressure 也 FAIL |
| P1KHV3620241217A05 | 1,020,000 | 392.3% | 1.487 | 2.308 | 455k / 175% 明确 fail，备注 C5/C7 两个通道吸水少 | 已有中途功能失败记录，且 920k pressure FAIL，建议按疑似失败样机处理 |
| P1KHV3620250311A04 | 1,020,000 | 392.3% | 0.677 | 1.052 | 主表未记录显式 fail，光学趋势最好 | 光学表现较稳定，但 920k pressure FAIL，需要压力复测确认 |
| P1KHV3620250624A01 | 1,020,000 | 392.3% | 1.633 | 3.046 | 195k / 75% 出现 H1、G12 low %D；520k CV 8.406 / worst 9.689 | 920k pressure PASS，但历史光学异常需持续监控 |
| P1KHV3620250624A05 | 1,020,000 | 392.3% | 6.839 | 3.150 | 最新 1020k 光学 CV 明显升高，plate1-3 均约 6.7-6.9，plate4/5 为 #DIV/0! | 高优先级复测光学；920k pressure FAIL |

## 4. 主表 PASS/FAIL 与异常节点

- 125%、150% 节点：主表显示 5 台均 PASS。
- 175% 节点：`P1KHV3620241217A05` 显示 fail，失败备注为 C5、C7 两个通道吸水少；其余样机显示 PASS。
- 200% 节点：`P1KHV3620250624A04` 记录漏油/背板有油/传感器报错，且该节点 CV across all dispenses 达 5.642，worst-channel CV 达 11.204。
- 392.3% 最新光学节点：所有样机 plate4、plate5 为 `#DIV/0!`，实际只使用 3 盘数据进行计算。该口径与早期 5 盘数据不可直接等价比较，应在报告和主表中标注为新测试标准。

## 5. 内嵌 Pressure 汇总页分析（125%-175%）

以下为每台样机在内嵌 Pressure 汇总页中，125%、150%、175% 三个节点的最大绝对 leak-rate outlier。由于这些页签的 `Pressure Test Results` 字段为空，本节仅作为压力趋势和异常通道筛查，不直接等同于最终 pass/fail。

| Pipette | 1 uL 最大 leak-rate | 50 uL 最大 leak-rate | 200 uL 最大 leak-rate | 观察 |
|---|---:|---:|---:|---|
| P1KHV3620250624A04 | 2.749 Pa/s，150%，G5 | 16.685 Pa/s，150%，F8 | 14.670 Pa/s，150%，A9 | 150% 节点压力 outlier 较集中 |
| P1KHV3620241217A05 | 14.047 Pa/s，150%，A12 | 17.420 Pa/s，150%，D11 | 20.430 Pa/s，150%，A12 | 与 175% 吸水 fail 和后续 pressure FAIL 风险一致 |
| P1KHV3620250311A04 | 17.569 Pa/s，125%，A1 | 17.532 Pa/s，125%，A1 | 53.269 Pa/s，125%，A1 | 早期已有明显 CH1/A1 outlier，需追溯原因 |
| P1KHV3620250624A01 | 12.308 Pa/s，175%，H4 | 17.019 Pa/s，175%，H9 | 41.726 Pa/s，150%，A10 | 早期压力 outlier 明显，但 920k Summary 通过 |
| P1KHV3620250624A05 | 4.006 Pa/s，150%，A12 | 17.281 Pa/s，125%，C12 | 15.602 Pa/s，125%，G2 | 最新光学偏高且 920k pressure FAIL，建议优先复测 |

## 6. 外链 Pressure Summary（920k 节点）

920k 外链为新版模板，包含 `Summary` 页和 10 轮 `Pressure Test-*` 页。Summary 已给出正式阈值和总体 Pass/Fail，结果如下：

| Pipette | Overall | Repeat | Insert min | 1 uL holding max | 50 uL holding max | 200 uL holding max | Fail channels |
|---|---|---:|---:|---|---|---|---|
| P1KHV3620250624A04 | FAIL | 10 | 1538.19 Pa, PASS | 3.922, FAIL | 0.3894, PASS | 2.7851, PASS | 1 uL: CH49 |
| P1KHV3620241217A05 | FAIL | 10 | 643.59 Pa, PASS | 15.252, FAIL | 5.3758, FAIL | 29.3903, FAIL | 1 uL: CH1, CH12；50 uL: CH1；200 uL: CH1, CH12 |
| P1KHV3620250311A04 | FAIL | 10 | 568.11 Pa, PASS | 6.6706, FAIL | 1.3427, FAIL | 8.0817, FAIL | 1 uL: CH18, CH50, CH68, CH88；50 uL: CH68, CH88；200 uL: CH5, CH12, CH18, CH21, CH50, CH68, CH88 |
| P1KHV3620250624A01 | PASS | 10 | 1809.06 Pa, PASS | 1.8803, PASS | 0.3763, PASS | 2.4928, PASS | None |
| P1KHV3620250624A05 | FAIL | 10 | 536.90 Pa, PASS | 5.0261, FAIL | 1.1492, FAIL | 5.7696, FAIL | 1 uL / 50 uL / 200 uL: CH1 |

结论：920k pressure link data 与主表部分 PASS 记录存在不一致。若以外链 Summary 的正式阈值为准，A04、1217A05、0311A04、A05 均应标记为 pressure FAIL 或至少要求复测确认。

## 7. 720k 外链 Pressure 数据与溯源问题

720k 外链为单页 `Pressure Test` 模板，未提供 Summary 页的总体 pass/fail 字段。本报告读取到的 item/value 摘要显示其主要为压力上下限和 holding/range/insert 值，适合做趋势追踪，但不适合单独作为最终判定。

数据质量问题：`P1KHV3620241217A05` 在 720k 行的 Pressure Test link 指向/显示为 `P1KHV3620250624A05` 的压力数据，疑似链接错挂。应修正该链接，否则 1217A05 的 720k 压力数据无法可靠追溯。

## 8. 数据质量风险

- 主表状态列仍为 `Running-(200%-238%)`，但最新实际已到 392.3%，状态未同步更新。
- 最新 1020k 光学数据只有 3 盘，plate4/plate5 为 `#DIV/0!`，与历史 5 盘口径不同。
- 主表 PASS 与外链 Summary FAIL 存在冲突，尤其是 920k pressure 节点。
- 720k pressure link 中发现样机号与链接目标不一致的问题。
- 内嵌 125%-175% Pressure 页缺少明确 pass/fail 字段，需要补充判定阈值或引用外链 Summary。

## 9. 建议行动

1. 立即复测 920k pressure FAIL 的 4 台样机：A04、1217A05、0311A04、A05，并以 Summary 阈值更新主表 PASS/FAIL。
2. 对 `P1KHV3620250624A05` 做 1020k 光学复测，确认高 CV 是否为真实性能退化、测试标准变化，或数据处理问题。
3. 对 `P1KHV3620250624A04` 追溯 520k 漏油/背板有油/传感器报错事件，检查是否与后续 CH49 pressure leak fail 相关。
4. 对 `P1KHV3620241217A05` 按历史 175% 吸水 fail 和 920k pressure fail 双重风险处理，重点检查 C5/C7、CH1、CH12。
5. 修正主表状态、720k 错挂链接、1020k 三盘测试口径说明，并在主表增加统一判定阈值，避免后续报告出现 PASS/FAIL 冲突。

