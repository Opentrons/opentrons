import { describe, expect, it } from 'vitest'

import { VACUUM_MODULE_TYPE } from '@opentrons/shared-data'
import { fixture_96_plate } from '@opentrons/shared-data/labware/fixtures/2'

import {
  getLabwareCompatibleWithModule,
  getLabwareIsCustom,
} from '../labwareModuleCompatibility'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

describe('labwareModuleCompatibility', () => {
  describe('getLabwareCompatibleWithModule', () => {
    const wellPlate = fixture_96_plate as LabwareDefinition2
    const filterPlate = {
      ...wellPlate,
      parameters: {
        ...wellPlate.parameters,
        loadName: 'empore_96_wellplate_1200ul_c18_filter',
        quirks: ['filterPlate', 'noLabwarePositionCheck'],
      },
    } as LabwareDefinition2

    it('does not allow filter plates directly on the vacuum module', () => {
      expect(
        getLabwareCompatibleWithModule(filterPlate, VACUUM_MODULE_TYPE)
      ).toBe(false)
    })

    it('still allows regular well plates on the vacuum module', () => {
      expect(
        getLabwareCompatibleWithModule(wellPlate, VACUUM_MODULE_TYPE)
      ).toBe(true)
    })
  })

  describe('getLabwareIsCustom', () => {
    const labwareOnDeck = {
      labwareDefURI: 'fixture/fixture_96_plate',
      id: 'abcef123',
      stack: ['abcef123', '3'],
      def: fixture_96_plate as LabwareDefinition2,
      pythonName: 'mockPythonName',
    }
    it('returns true when labware is inside custom labwares obj', () => {
      const customLabwares = {
        'fixture/fixture_96_plate': fixture_96_plate as LabwareDefinition2,
      }
      const labwareIsCustom = getLabwareIsCustom(customLabwares, labwareOnDeck)
      expect(labwareIsCustom).toEqual(true)
    })
    it('returns false when labware is not inside custom labwares obj', () => {
      const labwareIsCustom = getLabwareIsCustom({}, labwareOnDeck)
      expect(labwareIsCustom).toEqual(false)
    })
  })
})
