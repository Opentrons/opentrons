# Run 43 — adaptive slew 0.30 @ 90 s

- **FW:** integral fix + `ADAPTIVE_SLEW_END_FRACTION = 0.30`
- **Fixture:** water, 3×0.2 mm
- **Hold:** 90 s per target (steady = last ~30 s)

## Result: **8/8 PASS**

| target | mean_err | mean_abs | PASS |
|--------|----------|----------|------|
| −100…−500 | ~0 | ≤0.87 | Pass |
| −600 | +0.03 | 0.23 | Pass |
| −700 | +0.06 | 0.45 | Pass |
| −800 | +0.08 | **0.44** | **Pass** |

Compared to run 40 (same 0.30 @ 60 s): −800 mean_abs 2.49 → 0.44 with longer settle window.
