# Hold test run index

Sequence is chronological by when results were written.

| # | Folder | Fixture notes |
|---|--------|---------------|
| 01 | `01_deep_ripple_600_800` |  |
| 02 | `02_soft_hold_hyst_min0` |  |
| 03 | `03_soft_hold_800_fix` |  |
| 04 | `04_soft_hold_800_v2` |  |
| 05 | `05_soft_hold_800_v3` |  |
| 06 | `06_soft_hold_depth_gate` |  |
| 07 | `07_reentry_depth_hold` |  |
| 08 | `08_reentry_depth_hold_v2` |  |
| 09 | `09_fix_800` |  |
| 10 | `10_fix_800_v2` |  |
| 11 | `11_fix_800_v3` |  |
| 12 | `12_bias_zero` |  |
| 13 | `13_bias_zero_v2` |  |
| 14 | `14_bias_zero_v3` |  |
| 15 | `15_full_sweep_100_800` | full sweep dry deep free-rise issues |
| 16 | `16_full_sweep_fixed` |  |
| 17 | `17_full_sweep_pid_soft` |  |
| 18 | `18_baseline_hold_ff` |  |
| 19 | `19_soft_settled_lpf` |  |
| 20 | `20_test_run` |  |
| 21 | `21_commit_sweep` | commit list / metadata only |
| 22 | `22_208f0ace_dry_1x0p7mm` | commit bisect #1 baseline; **dry**, **1×0.7mm** hole |
| 23 | `23_1888194c_water_3x0p2mm` | commit bisect #2 integral fix; **water**, **3×0.2mm** holes |
| 24 | `24_1f73bc87_water_3x0p2mm` | commit bisect #3 holding FF at target; **water**, **3×0.2mm** |
| 25 | `25_ede8542f_water_3x0p2mm` | commit bisect #4 soft-hold past final; **water**, **3×0.2mm** |
| 26 | `26_5397af9e_water_3x0p2mm` | commit bisect #5 settled PID detune; **water**, **3×0.2mm** |
| 27 | `27_1753e83c_water_3x0p2mm` | commit bisect #6 pressure LPF; **water**, **3×0.2mm** |
| 28 | `28_9c22da8b_water_3x0p2mm` | commit bisect #7 M125/M126 hold knobs (defaults); **water**, **3×0.2mm** |
| 29 | `29_07101f71_water_3x0p2mm` | commit bisect #8 tip experimenting; **water**, **3×0.2mm** |

| 30 | `30_max_overshoot_6mbar_hard_brake` | experiment: MAX_OVERSHOOT=6 hard brake; free-rise at -800 |
| 31 | `31_soft_hold_residual_0p35` | experiment: residual 0.35× holding; free-rise -800 |
| 32 | `32_full_hold_ff_soft_residual` | experiment: full hold FF + residual 1.0; free-rise -800 |
| 33 | `33_freeze_I_full_hold_ff` | experiment: freeze I; deep bias -100/-700/-800 |
| 34 | `34_deep_hold_boost` | experiment: deep boost 1×; free-rise -800 |
| 35 | `35_deep_boost_settled_ff` | experiment: deep boost + settled FF; free-rise -800 |
| 36 | `36_deep_boost_3x_keep_I` | experiment: deep boost 3×; deep bias -700/-800 |
| 37 | `37_final_velocity_fade` | experiment: velocity fade last 50 mbar; free-rise -800 |

| 38 | `38_settled_full_hold_ff` | experiment: settled full hold FF only; free-rise -800 (worse) |
| 39 | `39_soft_residual_0p15` | experiment: residual 0.15× only; free-rise -800 (worse) |
| 40 | `40_adaptive_slew_0p30` | **best so far**: adaptive slew end 0.15→0.30; -800 mean_abs 2.49 (was 5.9) |
| 41 | `41_adaptive_slew_0p35` | adaptive slew 0.35; -800 worse than 0.30 |
| 42 | `42_adaptive_slew_0p28` | adaptive slew 0.28; -800 free-rise worse |
| 43 | `43_adaptive_slew_0p30_90s` | **8/8 PASS** adaptive 0.30 @ 90s holds |
| 44 | `44_adaptive_slew_0p32_90s` | 8/8 PASS adaptive 0.32 @ 90s (similar to 43) |
| 45 | `45_settled_hold_ff_by_rate` | rate-based full hold FF; -800 free-rise (bad) |
| 46 | `46_final_hold_ff_no_letup` | final-at-slew full hold FF; less undershoot; -800 mean_abs 1.68 |
| 47 | `47_final_hold_ff_floor_0p5` | final hold FF floor 0.5; -700/-800 fail (worse than 46) |
| 48 | `48_final_hold_ff_floor_0p75` | final hold FF floor 0.75; 7/8 pass, -800 p95 fail |

## Commit bisect plan

| # | Commit | Message |
|---|--------|---------|
| 22 | `208f0ace` | baseline #574 (done, dry 1×0.7mm) |
| 23 | `1888194c` | integral not wiped short of final (**done**, water 3×0.2mm) |
| 24 | `1f73bc87` | keep holding FF at target depth (**done**, water 3×0.2mm) |
| 25 | `ede8542f` | soft-hold past final (**done**, water 3×0.2mm) |
| 26 | `5397af9e` | settled PID detune (**done**, water 3×0.2mm) |
| 27 | `1753e83c` | pressure LPF (**done**, water 3×0.2mm) |
| 28 | `9c22da8b` | M125/M126 hold knobs (**done**, defaults, water 3×0.2mm) |
| 29 | `07101f71` | experimenting (**done**, water 3×0.2mm; tip hold-tuning-tip-save) |
