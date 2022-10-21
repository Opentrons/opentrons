import type { LabwareDefinition2 } from "@opentrons/shared-data";

export const mockTipRackDef: LabwareDefinition2 = {
  version: 1,
  schemaVersion: 2,
  namespace: 'custom',
  metadata: {
    displayName: 'Mock TipRack Definition',
    displayCategory: 'tipRack',
    displayVolumeUnits: 'mL',
  },
  dimensions: { xDimension: 0, yDimension: 0, zDimension: 0 },
  cornerOffsetFromSlot: { x: 0, y: 0, z: 0 },
  parameters: {
    loadName: 'mock_tiprack_definition',
    format: 'mock',
    isTiprack: true,
    isMagneticModuleCompatible: false,
  },
  brand: { brand: 'Opentrons' },
  ordering: [],
  wells: {},
  groups: [],
}