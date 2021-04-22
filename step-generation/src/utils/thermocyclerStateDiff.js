// @flow
import type { ThermocyclerStateStepArgs } from '../types'
import type { ThermocyclerModuleState } from '../../step-forms/types'

export type Diff = {
  lidOpen: boolean,
  lidClosed: boolean,
  setBlockTemperature: boolean,
  deactivateBlockTemperature: boolean,
  setLidTemperature: boolean,
  deactivateLidTemperature: boolean,
}

const getInitialDiff = () => ({
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
) => {
  if (!prevThermocyclerState.lidOpen && args.lidOpen) {
    return { lidOpen: true }
  }
  return {}
}

const getLidClosedDiff = (
  prevThermocyclerState: ThermocyclerModuleState,
  args: ThermocyclerStateStepArgs
) => {
  if (
    (prevThermocyclerState.lidOpen && args.lidOpen === false) ||
    (prevThermocyclerState.lidOpen === null && args.lidOpen === false)
  ) {
    return { lidClosed: true }
  }
  return {}
}

export const thermocyclerStateDiff = (
  prevThermocyclerState: ThermocyclerModuleState,
  args: ThermocyclerStateStepArgs
): Diff => {
  const lidOpenDiff = { ...getLidOpenDiff(prevThermocyclerState, args) }
  const lidClosedDiff = { ...getLidClosedDiff(prevThermocyclerState, args) }

  const blockTempChanged =
    prevThermocyclerState.blockTargetTemp !== args.blockTargetTemp
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
