// @flow
import type { LabwareDefinition2 } from '@opentrons/shared-data'

// TODO IMMEDIATELY is this needed?
export type DefsByLabwareId = {
  [labwareId: string]: LabwareDefinition2,
}

export type LabwareDefByDefId = {
  [otId: string]: LabwareDefinition2,
}
