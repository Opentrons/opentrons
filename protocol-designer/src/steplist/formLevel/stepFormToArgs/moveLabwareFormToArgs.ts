import type { LabwareMovementStrategy } from '@opentrons/shared-data'
import type { MoveLabwareArgs } from '@opentrons/step-generation'
import type { HydratedMoveLabwareFormData } from '../../../form-types'

export const moveLabwareFormToArgs = (
  hydratedFormData: HydratedMoveLabwareFormData
): MoveLabwareArgs => {
  const {
    labware,
    useGripper,
    newLocation,
    stepName,
    stepDetails,
  } = hydratedFormData

  return {
    commandCreatorFnName: 'moveLabware',
    name: stepName,
    description: stepDetails,
    labwareId: labware.id,
    newLocation,
    strategy: useGripper
      ? 'usingGripper'
      : ('manualMoveWithPause' as LabwareMovementStrategy),
  }
}
