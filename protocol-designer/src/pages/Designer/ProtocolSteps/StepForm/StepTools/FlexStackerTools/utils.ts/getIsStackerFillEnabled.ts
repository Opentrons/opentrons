import type { FlexStackerModuleState } from '@opentrons/step-generation'

export const getIsStackerFillEnabled = (
  stackerState: FlexStackerModuleState
): boolean => stackerState?.storedLabwareDetails?.primaryLabwareURI != null
