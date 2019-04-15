// @flow
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export type LabwareDefByDefId = {
  [otId: string]: LabwareDefinition2,
}
