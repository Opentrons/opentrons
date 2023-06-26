import type { HydratedMoveLabwareFormData } from '../../../form-types'
import type { MoveLabwareArgs } from '@opentrons/step-generation'

export const moveLabwareFormToArgs = (
  hydratedFormData: HydratedMoveLabwareFormData
): MoveLabwareArgs => {
  const { fields, description, stepName } = hydratedFormData
  const { labware, useGripper, newLocation } = fields

  return {
    commandCreatorFnName: 'moveLabware',
    name: stepName,
    description,
    labware: labware.id,
    useGripper,
    newLocation,
  }
}
