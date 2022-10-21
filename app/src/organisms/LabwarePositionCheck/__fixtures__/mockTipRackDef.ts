import type { LabwareDefinition2 } from '@opentrons/shared-data'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'

export const mockTipRackDef: LabwareDefinition2 = {
  ...(fixture_tiprack_10_ul as LabwareDefinition2),
  metadata: {
    displayName: 'Mock TipRack Definition',
    displayCategory: 'tipRack',
    displayVolumeUnits: 'mL',
  },
}
