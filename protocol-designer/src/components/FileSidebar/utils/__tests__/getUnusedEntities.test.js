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
import { getUnusedEntities } from '../getUnusedEntities'

describe('getUnusedEntities', () => {
  test('pipette entities not used in steps are returned', () => {
    const stepForms = {
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

    const result = getUnusedEntities(pipettesOnDeck, stepForms, 'pipette')

    expect(result).toEqual([pipettesOnDeck.pipette456])
  })

  test('module entities not used in steps are returned', () => {
    const stepForms = {
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
        type: TEMPDECK,
        model: 'GEN1',
        moduleState: {
          type: TEMPDECK,
          status: TEMPERATURE_DEACTIVATED,
          targetTemperature: null,
        },
        slot: '9',
      },
    }

    const result = getUnusedEntities(modulesOnDeck, stepForms, 'moduleId')

    expect(result).toEqual([modulesOnDeck.temperature456])
  })
})
