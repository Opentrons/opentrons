import { describe, expect, it } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'

import { getLabwareCompatibleForEditHardware } from '../utils'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

describe('getLabwareCompatibleForEditHardware', () => {
  it('return true when there is nothing on the slot', () => {
    expect(getLabwareCompatibleForEditHardware({}, 'cutoutA1')).toBe(true)
  })
  it('returns false when there there is something in slot A1 for a TC', () => {
    expect(
      getLabwareCompatibleForEditHardware(
        {
          labware: {
            id: 'labware',
            labwareDefURI: 'mockURI',
            def: fixture96Plate as LabwareDefinition2,
            stack: ['labware', 'A1'],
            pythonName: 'mockPythonName',
          },
        },
        'cutoutB1',
        {
          cutoutId: 'cutoutB1',
          cutoutFixtureId: 'thermocyclerModuleV2Front',
          type: 'thermocyclerModuleV2',
        }
      )
    ).toBe(false)
  })
  it('returns false when there there is something in slot B1 for a TC', () => {
    expect(
      getLabwareCompatibleForEditHardware(
        {
          labware: {
            id: 'labware',
            labwareDefURI: 'mockURI',
            def: fixture96Plate as LabwareDefinition2,
            stack: ['labware', 'B1'],
            pythonName: 'mockPythonName',
          },
        },
        'cutoutA1',
        {
          cutoutId: 'cutoutA1',
          cutoutFixtureId: 'thermocyclerModuleV2Front',
          type: 'thermocyclerModuleV2',
        }
      )
    ).toBe(false)
  })
  it('returns false when labware is incompatible with module', () => {
    expect(
      getLabwareCompatibleForEditHardware(
        {
          labware: {
            id: 'labware',
            labwareDefURI: 'mockURI',
            def: fixture96Plate as LabwareDefinition2,
            stack: ['labware', 'A3'],
            pythonName: 'mockPythonName',
          },
        },
        'cutoutA3',
        {
          cutoutId: 'cutoutA3',
          cutoutFixtureId: 'heaterShakerModuleV1',
          type: 'heaterShakerModuleV1',
        }
      )
    ).toBe(false)
  })
  it('returns false when labware is on trash bin', () => {
    expect(
      getLabwareCompatibleForEditHardware(
        {
          labware: {
            id: 'labware',
            labwareDefURI: 'mockURI',
            def: fixture96Plate as LabwareDefinition2,
            stack: ['labware', 'A3'],
            pythonName: 'mockPythonName',
          },
        },
        'cutoutA3',
        undefined,
        {
          type: 'trashBin',
          cutoutId: 'cutoutA3',
          cutoutFixtureId: 'trashBinAdapter',
        }
      )
    ).toBe(false)
  })
  it('returns true when there is no labware on slot and adding a trash bin', () => {
    expect(
      getLabwareCompatibleForEditHardware({}, 'cutoutA3', undefined, {
        type: 'trashBin',
        cutoutId: 'cutoutA3',
        cutoutFixtureId: 'trashBinAdapter',
      })
    ).toBe(true)
  })
})
