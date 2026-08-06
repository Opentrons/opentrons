import { formatPyValue } from '../pythonFormat'

export const getVacuumPumpHoldArgsPython = (
  duration: number,
  ventAfter?: boolean
): string[] => {
  return [
    `duration_s=${formatPyValue(duration)}`,
    ...(typeof ventAfter === 'boolean'
      ? [`vent_after=${formatPyValue(ventAfter)}`]
      : []),
  ]
}
