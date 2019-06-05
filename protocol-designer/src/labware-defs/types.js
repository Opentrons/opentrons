// @flow
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export type LabwareDefByDefURI = {
  [labwareDefURI: string]: LabwareDefinition2,
}
