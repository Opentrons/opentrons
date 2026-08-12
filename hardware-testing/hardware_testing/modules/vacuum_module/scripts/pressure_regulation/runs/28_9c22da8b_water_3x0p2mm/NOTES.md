# Run 28 — `9c22da8b` M125/M126 hold knobs (defaults)

- **Commit:** `9c22da8b` feat(vacuum-module): expose hold-path knobs on M125/M126
- **Firmware:** `FW:v0.0.11-6-g9c22da8b`
- **Fixture:** water, 3×0.2 mm holes
- **Targets:** −100…−800 mbar, 60 s each
- **Host:** robot still has old M126 parser; patched test skips extended A–E fields. Defaults reported in parse error:
  `A:0.25 B:0.40 N:0.15 X:0.55 F:10.0 L:0.30 E:5.0`

## Steady summary

| target | mean_err | mean_abs | PASS |
|--------|----------|----------|------|
| −100 | −3.43 | 3.43 | Fail (deep bias) |
| −200 | +0.13 | 0.89 | Pass |
| −300 | −0.14 | 0.86 | Pass |
| −400 | +0.01 | 1.55 | Pass |
| −500 | +0.33 | 1.37 | Pass |
| −600 | −0.97 | 2.00 | Pass (borderline) |
| −700 | −6.26 | 7.26 | Fail (deep + ripple) |
| −800 | −3.78 | 5.50 | Fail |

## vs run 27 (`1753e83c` LPF)

**Improved** −500 and −600 back to Pass (3/8 → 5/8). Deep −700/−800 still fail with large ripple. Knob commit alone should mostly expose defaults; any behavior delta may be from default constants matching soft-hold/detune paths or minor refactors.

## Takeaway

Default hold knobs do not fix −100 or deep (−700/−800). Mid-band restored vs LPF+detune stack. Still far from integral-only run 23 (7/8).
