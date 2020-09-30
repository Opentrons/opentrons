// @flow

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import * as Types from '../types'

export const mockDefinition: LabwareDefinition2 = {
  version: 1,
  schemaVersion: 2,
  namespace: 'custom',
  metadata: {
    displayName: 'Mock Definition',
    displayCategory: 'wellPlate',
    displayVolumeUnits: 'mL',
  },
  dimensions: { xDimension: 0, yDimension: 0, zDimension: 0 },
  cornerOffsetFromSlot: { x: 0, y: 0, z: 0 },
  parameters: {
    loadName: 'mock_definition',
    format: 'mock',
    isTiprack: false,
    isMagneticModuleCompatible: false,
  },
  brand: { brand: 'Opentrons' },
  ordering: [],
  wells: {},
  groups: [],
}

export const mockValidLabware: Types.ValidLabwareFile = {
  type: 'VALID_LABWARE_FILE',
  filename: 'a.json',
  modified: 1,
  definition: {
    ...mockDefinition,
    metadata: {
      ...mockDefinition.metadata,
      displayName: 'A',
    },
    parameters: { ...mockDefinition.parameters, loadName: 'a' },
  },
}

export const mockInvalidLabware: Types.InvalidLabwareFile = {
  type: 'INVALID_LABWARE_FILE',
  filename: 'b.json',
  modified: 2,
}

export const mockOpentronsLabware: Types.OpentronsLabwareFile = {
  type: 'OPENTRONS_LABWARE_FILE',
  filename: 'c.json',
  modified: 3,
  definition: {
    ...mockDefinition,
    namespace: 'opentrons',
    metadata: {
      ...mockDefinition.metadata,
      displayName: 'C',
    },
    parameters: { ...mockDefinition.parameters, loadName: 'c' },
  },
}

export const mockDuplicateLabware: Types.DuplicateLabwareFile = {
  type: 'DUPLICATE_LABWARE_FILE',
  filename: 'd.json',
  modified: 4,
  definition: {
    ...mockDefinition,
    metadata: {
      ...mockDefinition.metadata,
      displayName: 'D',
    },
    parameters: { ...mockDefinition.parameters, loadName: 'd' },
  },
}
