# Run 26 — `5397af9e` settled PID detune

- **Commit:** `5397af9e` fix(vacuum-module): detune PID once pressure hold is settled
- **Firmware:** `FW:v0.0.11-4-g5397af9e`
- **Fixture:** water, 3×0.2 mm holes (same as 23–25)
- **Targets:** −100…−800 mbar, 60 s each

## Steady summary

| target | mean_err | mean_abs | PASS |
|--------|----------|----------|------|
| −100 | −3.07 | 3.07 | Fail (deep bias) |
| −200 | +0.05 | 0.82 | Pass |
| −300 | −0.14 | 0.76 | Pass |
| −400 | −0.14 | 1.35 | Pass |
| −500 | +0.68 | 1.94 | Fail (borderline abs + p95) |
| −600 | −2.31 | 2.31 | Fail (deep bias) |
| −700 | −4.27 | 4.66 | Fail (deep + ripple) |
| −800 | −4.05 | 4.05 | Fail (deep bias) |

## vs run 25 (`ede8542f` soft-hold)

**Regression** at −500 and −600 (both Pass → Fail). Deep −700/−800 unchanged (still deep-biased). Settled PID detune weakens hold correction enough to allow more steady error / ripple under this fixture leak.

## Takeaway

On wet 3×0.2 mm, settled detune is **not a net win** for hold accuracy; it degrades mid-deep hold vs soft-hold-only stack.
