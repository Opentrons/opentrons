import type { MoveLabwareArgs } from '@opentrons/step-generation'
import type { HydratedMoveLabwareFormData } from '../../../form-types'
import type { GetCastFormData } from '../../fieldLevel'

export const moveLabwareFormToArgs = (
  castFormData: GetCastFormData<HydratedMoveLabwareFormData>
): MoveLabwareArgs => {
  const {
    labware,
    useGripper,
    newLocation,
    stepName,
    stepDetails,
  } = castFormData

  return {
    commandCreatorFnName: 'moveLabware',
    name: stepName,
    description: stepDetails,
    labwareId: labware.id,
    newLocation,
    strategy: useGripper ? 'usingGripper' : 'manualMoveWithPause',
  }
}
