# Run 29 — `07101f71` tip experimenting

- **Commit:** `07101f71` experimenting (branch `hold-tuning-tip-save`)
- **Firmware:** `FW:v0.0.11-7-g07101f71`
- **Fixture:** water, 3×0.2 mm holes
- **Targets:** −100…−800 mbar, 60 s each
- **M126 defaults** (parse skip): `A:0.25 B:0.40 N:0.08 X:0.55 F:12.0 L:0.30 E:5.0`
  (N/F differ from 9c22da8b defaults N:0.15 F:10.0)

## Steady summary

| target | mean_err | mean_abs | PASS | bias |
|--------|----------|----------|------|------|
| −100 | +1.75 | 2.29 | Fail | shallow |
| −200 | +0.03 | 0.97 | Pass | |
| −300 | +1.72 | 2.19 | Fail | shallow |
| −400 | +3.13 | 3.64 | Fail | shallow + ripple |
| −500 | +1.34 | 1.80 | Fail | shallow |
| −600 | +4.52 | 5.70 | Fail | free-rise / ripple |
| −700 | +6.13 | 7.51 | Fail | free-rise / ripple |
| −800 | +9.49 | 10.58 | Fail | free-rise / ripple |

## vs run 28 (`9c22da8b`)

**Strong regression:** 5/8 → 1/8. Bias sign flips from deep (over-hold, mean_err < 0) to **shallow / free-rise** (mean_err > 0) at mid–deep targets. Matches soft-hold hysteresis / residual-floor experiments that under-hold under this leak.

## Takeaway

Tip experimental stack is **not** a hold accuracy improvement on wet 3×0.2 mm. Prefer integral-only (run 23) as baseline for next tuning; discard or heavily rework tip soft-hold/hysteresis defaults.
