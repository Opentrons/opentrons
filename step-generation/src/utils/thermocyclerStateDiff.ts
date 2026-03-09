import type {
  ThermocyclerModuleState,
  ThermocyclerStateStepArgs,
} from '../types'

export interface Diff {
  lidOpen: boolean
  lidClosed: boolean

  setBlockTemperature: boolean
  deactivateBlockTemperature: boolean

  setLidTemperature: boolean
  deactivateLidTemperature: boolean
}

const getInitialDiff = (): Diff => ({
  lidOpen: false,
  lidClosed: false,
  setBlockTemperature: false,
  deactivateBlockTemperature: false,
  setLidTemperature: false,
  deactivateLidTemperature: false,
})

const getLidOpenDiff = (
  prevThermocyclerState: ThermocyclerModuleState,
  args: ThermocyclerStateStepArgs
): Partial<Diff> => {
  if (!prevThermocyclerState.lidOpen && args.lidOpen) {
    return {
      lidOpen: true,
    }
  }

  return {}
}

const getLidClosedDiff = (
  prevThermocyclerState: ThermocyclerModuleState,
  args: ThermocyclerStateStepArgs
): Partial<Diff> => {
  if (
    (prevThermocyclerState.lidOpen && !args.lidOpen) ||
    (prevThermocyclerState.lidOpen === null && !args.lidOpen)
  ) {
    return {
      lidClosed: true,
    }
  }

  return {}
}

const isBlockCurrentlyTargetingTemp = (
  thermocyclerState: ThermocyclerModuleState,
  temp: number | null
): boolean => {
  if (temp == null) {
    // Is the block deactivated?
    return thermocyclerState.currentBlockActivity.type === 'blockDeactivated'
  } else {
    // Is the block targeting the given temp?
    return (
      thermocyclerState.currentBlockActivity.type === 'blockTargetTemp' &&
      thermocyclerState.currentBlockActivity.blockTargetTemp === temp
    )
  }
}

export const thermocyclerStateDiff = (
  prevThermocyclerState: ThermocyclerModuleState,
  args: ThermocyclerStateStepArgs
): Diff => {
  const lidOpenDiff = { ...getLidOpenDiff(prevThermocyclerState, args) }
  const lidClosedDiff = { ...getLidClosedDiff(prevThermocyclerState, args) }

  const blockTempChanged = !isBlockCurrentlyTargetingTemp(
    prevThermocyclerState,
    args.blockTargetTemp
  )
  const blockTempDeactivated = blockTempChanged && args.blockTargetTemp === null
  const blockTempActivated = blockTempChanged && args.blockTargetTemp !== null

  const lidTempChanged =
    prevThermocyclerState.lidTargetTemp !== args.lidTargetTemp
  const lidTempDeactivated = lidTempChanged && args.lidTargetTemp === null
  const lidTempActivated = lidTempChanged && args.lidTargetTemp !== null

  return {
    ...getInitialDiff(),
    ...lidOpenDiff,
    ...lidClosedDiff,
    setBlockTemperature: blockTempActivated,
    deactivateBlockTemperature: blockTempDeactivated,
    setLidTemperature: lidTempActivated,
    deactivateLidTemperature: lidTempDeactivated,
  }
}
