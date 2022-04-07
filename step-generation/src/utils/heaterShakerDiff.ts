import type { HeaterShakerModuleState, HeaterShakerArgs } from '../types'

export interface Diff {
  latchOpen: boolean
  latchClosed: boolean
  setTemperature: boolean
  deactivateHeater: boolean
  setShakeSpeed: boolean
  stopShake: boolean
}

const getInitialDiff = (): Diff => ({
  latchOpen: false,
  latchClosed: false,
  setTemperature: false,
  deactivateHeater: false,
  setShakeSpeed: false,
  stopShake: false,
})

const getLatchOpenDiff = (
  prevHeaterShakerState: HeaterShakerModuleState,
  args: HeaterShakerArgs
): Partial<Diff> => {
  if (!prevHeaterShakerState.latchOpen && args.latchOpen) {
    return {
      latchOpen: true,
    }
  }

  return {}
}

const getLatchClosedDiff = (
  prevHeaterShakerState: HeaterShakerModuleState,
  args: HeaterShakerArgs
): Partial<Diff> => {
  if (
    (prevHeaterShakerState.latchOpen && !args.latchOpen) ??
    (prevHeaterShakerState.latchOpen === null && !args.latchOpen)
  ) {
    return {
      latchOpen: true,
    }
  }

  return {}
}

export const heaterShakerDiff = (
  prevHeaterShakerState: HeaterShakerModuleState,
  args: HeaterShakerArgs
): Diff => {
  const latchOpenDiff = { ...getLatchOpenDiff(prevHeaterShakerState, args) }
  const lidClosedDiff = { ...getLatchClosedDiff(prevHeaterShakerState, args) }
  const tempChanged =
    prevHeaterShakerState.targetTemp !== args.targetTemperature
  const heaterDeactivated = tempChanged && args.targetTemperature === null
  const heaterActivated = tempChanged && args.targetTemperature !== null
  const speedChanged = prevHeaterShakerState.targetSpeed !== args.rpm
  const shakerDeactivated = speedChanged && args.rpm === null
  const shakerActivated = speedChanged && args.rpm !== null

  return {
    ...getInitialDiff(),
    ...latchOpenDiff,
    ...lidClosedDiff,
    setTemperature: heaterActivated,
    deactivateHeater: heaterDeactivated,
    setShakeSpeed: shakerActivated,
    stopShake: shakerDeactivated,
  }
}
