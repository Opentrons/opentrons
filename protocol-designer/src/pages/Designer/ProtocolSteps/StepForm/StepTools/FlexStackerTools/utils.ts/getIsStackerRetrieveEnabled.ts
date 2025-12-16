import type { FlexStackerModuleState } from '@opentrons/step-generation'

export const getIsStackerRetrieveEnabled = (
  stackerState: FlexStackerModuleState
): boolean => {
  const { labwareInHopper, labwareOnShuttle } = stackerState ?? {}
  return (
    labwareInHopper != null &&
    labwareInHopper.length > 0 &&
    labwareOnShuttle == null
  )
}
