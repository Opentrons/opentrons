import { fixture96Plate } from '@opentrons/shared-data'

import type { LabwareDefinition } from '@opentrons/shared-data'

export const mockLabwareDef: LabwareDefinition = {
  ...(fixture96Plate as LabwareDefinition),
  metadata: {
    displayName: 'Mock Labware Definition',
    displayCategory: 'wellPlate',
    displayVolumeUnits: 'mL',
  },
}
