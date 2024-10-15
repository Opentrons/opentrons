import type { LabwareDefinition2 } from '..'
import fixedTrashUncasted from '../../labware/definitions/2/opentrons_1_trash_3200ml_fixed/1.json'

export function getFixedTrashLabwareDefinition(): LabwareDefinition2 {
  const LabwareDefinition2 = (fixedTrashUncasted as unknown) as LabwareDefinition2
  return LabwareDefinition2
}
