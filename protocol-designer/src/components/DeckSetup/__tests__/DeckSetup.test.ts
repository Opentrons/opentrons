import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import fixture_24_tuberack from '@opentrons/shared-data/labware/fixtures/2/fixture_24_tuberack.json'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  TEMPERATURE_MODULE_V1,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import { TEMPERATURE_AT_TARGET } from '@opentrons/step-generation'
import * as labwareModuleCompatibility from '../../../utils/labwareModuleCompatibility'
import { getSwapBlocked, SwapBlockedArgs } from '..'

describe('DeckSetup', () => {
  describe('getSwapBlocked', () => {
    const plateInSlot3 = {
      labwareDefURI: 'fixture/fixture_96_plate',
      id: 'plate123',
      slot: '3',
      def: fixture_96_plate as LabwareDefinition2,
    }
    const tuberackInSlot4 = {
      labwareDefURI: 'fixture/fixtures_24_tuberack',
      id: 'tuberack098',
      slot: '4',
      def: fixture_24_tuberack as LabwareDefinition2,
    }

    const magneticModule = {
      id: 'magnet123',
      type: MAGNETIC_MODULE_TYPE,
      model: MAGNETIC_MODULE_V1,
      moduleState: {
        type: MAGNETIC_MODULE_TYPE,
        engaged: false,
      },
      slot: '1',
    }
    const temperatureModule = {
      id: 'temperature098',
      type: TEMPERATURE_MODULE_TYPE,
      model: TEMPERATURE_MODULE_V1,
      moduleState: {
        type: TEMPERATURE_MODULE_TYPE,
        status: TEMPERATURE_AT_TARGET,
        targetTemperature: 45,
      },
      slot: '7',
    }

    let getLabwareIsCompatibleSpy: jest.SpiedFunction<
      typeof labwareModuleCompatibility.getLabwareIsCompatible
    >
    beforeEach(() => {
      getLabwareIsCompatibleSpy = jest.spyOn(
        labwareModuleCompatibility,
        'getLabwareIsCompatible'
      )
    })

    afterEach(() => {
      getLabwareIsCompatibleSpy.mockClear()
    })

    it('is not blocked when there is no labware in slot', () => {
      const args: SwapBlockedArgs = {
        hoveredLabware: null,
        draggedLabware: plateInSlot3,
        modulesById: {},
        customLabwareDefs: {},
      }

      const isBlocked = getSwapBlocked(args)

      expect(isBlocked).toEqual(false)
    })

    it('is not blocked when no dragged labware', () => {
      const args: SwapBlockedArgs = {
        hoveredLabware: plateInSlot3,
        draggedLabware: null,
        modulesById: {},
        customLabwareDefs: {},
      }

      const isBlocked = getSwapBlocked(args)

      expect(isBlocked).toEqual(false)
    })

    it('is not blocked when dragged labware to swap on module is custom', () => {
      tuberackInSlot4.slot = 'magnet123'
      getLabwareIsCompatibleSpy.mockReturnValue(false)
      const args: SwapBlockedArgs = {
        hoveredLabware: tuberackInSlot4,
        draggedLabware: plateInSlot3,
        modulesById: {
          magnet123: magneticModule,
        },
        customLabwareDefs: {
          'fixture/fixture_96_plate': fixture_96_plate as LabwareDefinition2,
        },
      }

      const isBlocked = getSwapBlocked(args as SwapBlockedArgs)

      expect(isBlocked).toEqual(false)
    })

    it('is blocked when dragged labware on module to swap on another module is not custom and not compatible', () => {
      tuberackInSlot4.slot = 'magnet123'
      getLabwareIsCompatibleSpy.mockReturnValue(false)
      const args: SwapBlockedArgs = {
        hoveredLabware: tuberackInSlot4,
        draggedLabware: plateInSlot3,
        modulesById: {
          magnet123: magneticModule,
        },
        customLabwareDefs: {},
      }

      const isBlocked = getSwapBlocked(args)

      expect(isBlocked).toEqual(true)
    })

    it('is blocked when target labware on module to swap is incompatible with dragged labware', () => {
      tuberackInSlot4.slot = 'magnet123'
      getLabwareIsCompatibleSpy.mockReturnValue(false)
      const args: SwapBlockedArgs = {
        hoveredLabware: tuberackInSlot4,
        draggedLabware: plateInSlot3,
        modulesById: {
          magnet123: magneticModule,
        },
        customLabwareDefs: {},
      }

      const isBlocked = getSwapBlocked(args)

      expect(isBlocked).toEqual(true)
    })

    it('is not blocked when labwares to swap on both modules are compatible', () => {
      tuberackInSlot4.slot = 'magnet123'
      plateInSlot3.slot = 'temperature098'
      getLabwareIsCompatibleSpy.mockReturnValue(true)
      const args: SwapBlockedArgs = {
        hoveredLabware: tuberackInSlot4,
        draggedLabware: plateInSlot3,
        modulesById: {
          magnet123: magneticModule,
          temperature098: temperatureModule,
        },
        customLabwareDefs: {},
      }

      const isBlocked = getSwapBlocked(args)

      expect(isBlocked).toEqual(false)
    })

    it('is blocked when both dragged and target labwares on the modules are incompatible', () => {
      tuberackInSlot4.slot = 'magnet123'
      plateInSlot3.slot = 'temperature098'
      getLabwareIsCompatibleSpy.mockReturnValue(false)
      const args: SwapBlockedArgs = {
        hoveredLabware: tuberackInSlot4,
        draggedLabware: plateInSlot3,
        modulesById: {
          magnet123: magneticModule,
          temperature098: temperatureModule,
        },
        customLabwareDefs: {},
      }

      const isBlocked = getSwapBlocked(args)

      expect(isBlocked).toEqual(true)
    })

    it('is not blocked when swapping labware from module with compatible labware on deck slot', () => {
      plateInSlot3.slot = 'temperature098'
      getLabwareIsCompatibleSpy.mockReturnValue(true)
      const args: SwapBlockedArgs = {
        hoveredLabware: tuberackInSlot4,
        draggedLabware: plateInSlot3,
        modulesById: {
          temperature098: temperatureModule,
        },
        customLabwareDefs: {},
      }

      const isBlocked = getSwapBlocked(args)

      expect(isBlocked).toEqual(false)
    })

    it('is not blocked when swapping labware from one deck slot with another labware on deck slot', () => {
      const args: SwapBlockedArgs = {
        hoveredLabware: tuberackInSlot4,
        draggedLabware: plateInSlot3,
        modulesById: {},
        customLabwareDefs: {},
      }

      const isBlocked = getSwapBlocked(args)

      expect(isBlocked).toEqual(false)
    })

    it('is not blocked when swapping compatible labware on deck slot with labware on module', () => {
      tuberackInSlot4.slot = 'magnet123'
      getLabwareIsCompatibleSpy.mockReturnValue(true)
      const args: SwapBlockedArgs = {
        hoveredLabware: tuberackInSlot4,
        draggedLabware: plateInSlot3,
        modulesById: {
          magnet123: magneticModule,
        },
        customLabwareDefs: {},
      }

      const isBlocked = getSwapBlocked(args)

      expect(isBlocked).toEqual(false)
    })
  })
})
