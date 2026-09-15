/**
 * Display-only tolerance for atmospheric pressure.
 */
export const PRESSURE_ATM_TOLERANCE_MBAR = 8

export const formatDisplayPressureMbar = (
  pressureMbar: number | null
): number | null => {
  if (
    pressureMbar === null ||
    Math.abs(pressureMbar) <= PRESSURE_ATM_TOLERANCE_MBAR
  ) {
    return null
  }

  return Math.round(pressureMbar * 10) / 10
}
