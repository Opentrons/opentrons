# Run 27 — `1753e83c` pressure LPF

- **Commit:** `1753e83c` fix(vacuum-module): low-pass filter absolute pressure before PID
- **Firmware:** `FW:v0.0.11-5-g1753e83c`
- **Fixture:** water, 3×0.2 mm holes (same as 23–26)
- **Targets:** −100…−800 mbar, 60 s each

## Steady summary

| target | mean_err | mean_abs | PASS |
|--------|----------|----------|------|
| −100 | −3.22 | 3.22 | Fail (deep bias) |
| −200 | −0.05 | 0.97 | Pass |
| −300 | −0.16 | 0.84 | Pass |
| −400 | +0.13 | 1.50 | Pass |
| −500 | +1.00 | 1.79 | Fail |
| −600 | −1.08 | 2.20 | Fail |
| −700 | −6.87 | 7.63 | Fail (worse ripple/deep) |
| −800 | −3.36 | 5.15 | Fail |

## vs run 26 (`5397af9e` settled detune)

Same pass/fail pattern (3/8 pass). −700 clearly worse (mean_abs 4.66 → 7.63, higher stdev/p95). LPF on top of detune stack does not recover hold accuracy; may add lag that hurts deep hold on this leak.

## Takeaway

Pressure LPF is **not a net win** on this fixture/stack for hold accuracy; deep hold degrades further vs soft-hold-only (run 25).
