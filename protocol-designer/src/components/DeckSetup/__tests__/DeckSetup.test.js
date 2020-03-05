// @flow

import fixture_96_plate_def from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import fixture_24_tuberack_def from '@opentrons/shared-data/labware/fixtures/2/fixture_24_tuberack.json'
import { getSwapBlocked } from '../DeckSetup'
import * as labwareModuleCompatibility from '../../../utils/labwareModuleCompatibility'
import type { LabwareDefinition2, ModuleRealType } from '@opentrons/shared-data'

jest.mock('../../../utils/labwareModuleCompatibility')

const getLabwareIsCompatibleMock: JestMockFn<
  [LabwareDefinition2, ModuleRealType],
  boolean
> = labwareModuleCompatibility.getLabwareIsCompatible

describe('DeckSetup', () => {
  describe('getSwapBlocked', () => {
    const fixture_96_plate = {
      labwareDefURI: 'fixture/fixture_96_plate',
      id: 'plate123',
      slot: '3',
      def: fixture_96_plate_def,
    }
    const fixture_24_tuberack = {
      labwareDefURI: 'fixture/fixtures_24_tuberack',
      id: 'tuberack098',
      slot: '4',
      def: fixture_24_tuberack_def,
    }

    it('is not blocked when there is no labware in slot', () => {
      const args = {
        hoveredLabware: null,
        draggedLabware: fixture_96_plate,
        modulesById: {},
        customLabwares: {},
      }

      const isBlocked = getSwapBlocked(args)

      expect(isBlocked).toEqual(false)
    })

    it('is not blocked when no dragged labware', () => {
      const args = {
        hoveredLabware: fixture_96_plate,
        draggedLabware: null,
        modulesById: {},
        customLabwares: {},
      }

      const isBlocked = getSwapBlocked(args)

      expect(isBlocked).toEqual(false)
    })

    it('is not blocked when dragged labware to swap on module is custom', () => {
      fixture_24_tuberack.slot = 'magnet123'
      getLabwareIsCompatibleMock.mockReturnValue(false)
      const args = {
        hoveredLabware: fixture_24_tuberack,
        draggedLabware: fixture_96_plate,
        modulesById: {
          magnet123: {
            id: 'magnet123',
            type: 'magneticModuleType',
            model: 'GEN1',
            moduleState: {
              type: 'magneticModuleType',
              engaged: false,
            },
            slot: '1',
          },
        },
        customLabwares: {
          'fixture/fixture_96_plate': fixture_96_plate_def,
        },
      }

      const isBlocked = getSwapBlocked(args)

      expect(isBlocked).toEqual(false)
    })

    it('is blocked when dragged labware to swap is not custom and not compatible', () => {
      fixture_24_tuberack.slot = 'magnet123'
      getLabwareIsCompatibleMock.mockReturnValue(false)
      const args = {
        hoveredLabware: fixture_24_tuberack,
        draggedLabware: fixture_96_plate,
        modulesById: {
          magnet123: {
            id: 'magnet123',
            type: 'magneticModuleType',
            model: 'GEN1',
            moduleState: {
              type: 'magneticModuleType',
              engaged: false,
            },
            slot: '1',
          },
        },
        customLabwares: {},
      }

      const isBlocked = getSwapBlocked(args)

      expect(isBlocked).toEqual(true)
    })

    it('is not blocked when both labwares are compatible', () => {
      fixture_24_tuberack.slot = 'magnet123'
      getLabwareIsCompatibleMock.mockReturnValue(true)
      const args = {
        hoveredLabware: fixture_24_tuberack,
        draggedLabware: fixture_96_plate,
        modulesById: {
          magnet123: {
            id: 'magnet123',
            type: 'magneticModuleType',
            model: 'GEN1',
            moduleState: {
              type: 'magneticModuleType',
              engaged: false,
            },
            slot: '1',
          },
        },
        customLabwares: {},
      }

      const isBlocked = getSwapBlocked(args)

      expect(isBlocked).toEqual(false)
    })
  })
})
