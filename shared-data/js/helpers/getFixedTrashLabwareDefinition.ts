import fixedTrashUncasted from '../../labware/definitions/2/opentrons_1_trash_3200ml_fixed/1.json'

import type { LabwareDefinition } from '..'

export function getFixedTrashLabwareDefinition(): LabwareDefinition {
  const LabwareDefinition = (fixedTrashUncasted as unknown) as LabwareDefinition
  return LabwareDefinition
}
