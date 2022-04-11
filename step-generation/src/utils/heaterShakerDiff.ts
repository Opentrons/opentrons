import type { HeaterShakerModuleState, HeaterShakerArgs } from '../types'

export interface Diff {
  latchOpen: boolean
  setTemperature: boolean
  deactivateHeater: boolean
  setShakeSpeed: boolean
  stopShake: boolean
}

const getInitialDiff = (): Diff => ({
  latchOpen: false,
  setTemperature: false,
  deactivateHeater: false,
  setShakeSpeed: false,
  stopShake: false,
})

export const heaterShakerDiff = (
  prevHeaterShakerState: HeaterShakerModuleState,
  args: HeaterShakerArgs
): Diff => {
  const latchOpen = args.latchOpen
  const tempChanged =
    prevHeaterShakerState.targetTemp !== args.targetTemperature
  const heaterDeactivated = tempChanged && args.targetTemperature === null
  const heaterActivated = tempChanged && args.targetTemperature !== null
  const speedChanged = prevHeaterShakerState.targetSpeed !== args.rpm
  const shakerDeactivated = speedChanged && args.rpm === null
  const shakerActivated = speedChanged && args.rpm !== null

  return {
    ...getInitialDiff(),
    latchOpen,
    setTemperature: heaterActivated,
    deactivateHeater: heaterDeactivated,
    setShakeSpeed: shakerActivated,
    stopShake: shakerDeactivated,
  }
}
