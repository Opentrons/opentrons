// @flow
import {
  fixtureP10Single,
  fixtureP300Single,
} from '@opentrons/shared-data/pipette/fixtures/name'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import {
  MAGDECK,
  TEMPDECK,
  TEMPERATURE_DEACTIVATED,
} from '../../../../constants'
import { getUnusedPipettes, getUnusedModules } from '../getUnusedEntities'

describe('getUnusedEntities', () => {
  describe('getUnusedPipettes', () => {
    test('pipette entities not used in steps are returned', () => {
      const commands = {
        step123: {
          pipette: 'pipette123',
          id: 'step123',
          stepType: 'transfer',
        },
      }
      const pipettesOnDeck = {
        pipette123: {
          name: 'string',
          id: 'pipette123',
          tiprackDefURI: 'test',
          tiprackLabwareDef: fixture_tiprack_10_ul,
          spec: fixtureP10Single,
          mount: 'right',
        },
        pipette456: {
          name: 'string',
          id: 'pipette456',
          tiprackDefURI: 'test',
          tiprackLabwareDef: fixture_tiprack_10_ul,
          spec: fixtureP300Single,
          mount: 'left',
        },
      }

      const result = getUnusedPipettes(pipettesOnDeck, commands)

      expect(result).toEqual([pipettesOnDeck.pipette456])
    })
  })

  describe('getUnusedModules', () => {
    test('module entities not used in steps are returned', () => {
      const commands = {
        step123: {
          moduleId: 'magnet123',
          id: 'step123',
          magnetAction: 'engage',
          engageHeight: '10',
          stepType: 'magnet',
          stepName: 'magnet',
          stepDetails: '',
        },
      }
      const modulesOnDeck = {
        magnet123: {
          id: 'magnet123',
          type: MAGDECK,
          model: 'GEN1',
          slot: '3',
          moduleState: {
            type: MAGDECK,
            engaged: false,
          },
        },
        temperature456: {
          id: 'temperature456',
          type: 'tempdeck',
          model: 'GEN1',
          moduleState: {
            type: TEMPDECK,
            status: TEMPERATURE_DEACTIVATED,
            targetTemperature: null,
          },
          slot: '9',
        },
      }

      const result = getUnusedModules(modulesOnDeck, commands)

      expect(result).toEqual([modulesOnDeck.temperature456])
    })
  })
})
