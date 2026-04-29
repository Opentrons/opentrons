import { formatPyValue } from '../pythonFormat'

export const getVacuumPumpHoldArgsPython = (
  duration: number,
  ventAfter?: boolean
): string[] => {
  return [
    `duration=${formatPyValue(duration)}`,
    ...(ventAfter != null ? [`vent_after=${formatPyValue(ventAfter)}`] : []),
  ]
}
