import { describe, expect, it } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'

import { getLabwareIsCustom } from '../labwareModuleCompatibility'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

describe('labwareModuleCompatibility', () => {
  describe('getLabwareIsCustom', () => {
    const labwareOnDeck = {
      labwareDefURI: 'fixture/fixture_96_plate',
      id: 'abcef123',
      stack: ['abcef123', '3'],
      def: fixture96Plate as LabwareDefinition2,
      pythonName: 'mockPythonName',
    }
    it('returns true when labware is inside custom labwares obj', () => {
      const customLabwares = {
        'fixture/fixture_96_plate': fixture96Plate as LabwareDefinition2,
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
