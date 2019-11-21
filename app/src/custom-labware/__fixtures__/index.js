// @flow

import * as Types from '../types'

export const mockValidLabware: Types.ValidLabwareFile = {
  type: 'VALID_LABWARE_FILE',
  filename: 'a.json',
  created: 1,
  identity: { name: 'a', namespace: 'custom', version: 1 },
  metadata: {
    displayName: 'A',
    displayCategory: 'wellPlate',
    displayVolumeUnits: 'mL',
  },
}

export const mockInvalidLabware: Types.InvalidLabwareFile = {
  type: 'INVALID_LABWARE_FILE',
  filename: 'b.json',
  created: 2,
}

export const mockOpentronsLabware: Types.OpentronsLabwareFile = {
  type: 'OPENTRONS_LABWARE_FILE',
  filename: 'c.json',
  created: 3,
  identity: { name: 'c', namespace: 'opentrons', version: 1 },
  metadata: {
    displayName: 'C',
    displayCategory: 'wellPlate',
    displayVolumeUnits: 'mL',
  },
}

export const mockDuplicateLabware: Types.DuplicateLabwareFile = {
  type: 'DUPLICATE_LABWARE_FILE',
  filename: 'd.json',
  created: 4,
  identity: { name: 'd', namespace: 'custom', version: 1 },
  metadata: {
    displayName: 'D',
    displayCategory: 'wellPlate',
    displayVolumeUnits: 'mL',
  },
}
