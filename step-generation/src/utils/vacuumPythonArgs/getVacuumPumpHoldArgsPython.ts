import { formatPyRuntimeValue } from '../pythonFormat'

export const getVacuumPumpHoldArgsPython = (
  duration: number | string,
  ventAfter?: boolean | string
): string[] => {
  return [
    `duration_s=${formatPyRuntimeValue(duration)}`,
    ...(ventAfter != null
      ? [`vent_after=${formatPyRuntimeValue(ventAfter)}`]
      : []),
  ]
}
