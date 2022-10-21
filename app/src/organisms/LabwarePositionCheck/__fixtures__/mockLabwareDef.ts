import type { LabwareDefinition2 } from '@opentrons/shared-data'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'

export const mockLabwareDef: LabwareDefinition2 = {
  ...(fixture_96_plate as LabwareDefinition2),
  metadata: {
    displayName: 'Mock Labware Definition',
    displayCategory: 'wellPlate',
    displayVolumeUnits: 'mL',
  },
}
