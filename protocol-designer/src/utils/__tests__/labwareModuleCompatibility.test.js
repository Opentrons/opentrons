import fixture_96_plate_def from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'

import { getLabwareIsCustom } from '../labwareModuleCompatibility'

describe('labwareModuleCompatibility', () => {
  describe('getLabwareIsCustom', () => {
    const labwareOnDeck = {
      labwareDefURI: 'fixture/fixture_96_plate',
      id: 'abcef123',
      slot: '3',
      def: fixture_96_plate_def,
    }

    it('returns true when labware is inside custom labwares obj', () => {
      const customLabwares = {
        'fixture/fixture_96_plate': fixture_96_plate_def,
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
