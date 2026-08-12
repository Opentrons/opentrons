# Run 25 — `ede8542f` soft-hold past final

- **Commit:** `ede8542f` fix(vacuum-module): soft-hold past final pressure target
- **Firmware:** `FW:v0.0.11-3-gede8542f`
- **Fixture:** water, 3×0.2 mm holes (same as 23/24)
- **Targets:** −100…−800 mbar, 60 s each

## Steady summary

| target | mean_err | mean_abs | PASS |
|--------|----------|----------|------|
| −100 | −2.80 | 2.80 | Fail (deep bias) |
| −200 | −0.10 | 0.81 | Pass |
| −300 | −0.02 | 0.64 | Pass |
| −400 | +0.06 | 0.92 | Pass |
| −500 | +0.39 | 0.95 | Pass |
| −600 | −0.22 | 0.74 | Pass |
| −700 | −4.51 | 4.79 | Fail (deep bias + ripple) |
| −800 | −4.05 | 4.05 | Fail (deep bias) |

## vs run 24 (`1f73bc87` holding FF)

Same pass/fail pattern. Soft-hold past final does **not** clearly improve mid-band (already good) or deep (−700/−800 still deep-biased). Slight numeric differences at −700/−800 are within run-to-run noise / fixture variation.

## vs run 23 (`1888194c` integral fix)

Still a regression vs integral-only at −100 (deep bias) and −700 (pass→fail from holding-FF stack). Soft-hold does not recover those.
