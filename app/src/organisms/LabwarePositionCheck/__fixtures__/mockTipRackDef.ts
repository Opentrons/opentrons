import { fixtureTiprack10ul } from '@opentrons/shared-data'

import type { LabwareDefinition } from '@opentrons/shared-data'

export const mockTipRackDef: LabwareDefinition = {
  ...(fixtureTiprack10ul as LabwareDefinition),
  metadata: {
    displayName: 'Mock TipRack Definition',
    displayCategory: 'tipRack',
    displayVolumeUnits: 'mL',
  },
}
