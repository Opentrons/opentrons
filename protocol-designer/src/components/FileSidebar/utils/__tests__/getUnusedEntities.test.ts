import {
  fixtureP10Single,
  fixtureP300Single,
} from '@opentrons/shared-data/pipette/fixtures/name'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  TEMPERATURE_MODULE_V1,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
} from '@opentrons/shared-data'
import { TEMPERATURE_DEACTIVATED } from '@opentrons/step-generation'
import { SavedStepFormState } from '../../../../step-forms'
import { getUnusedEntities } from '../getUnusedEntities'

describe('getUnusedEntities', () => {
  it('pipette entities not used in steps are returned', () => {
    const stepForms: SavedStepFormState = {
      step123: {
        pipette: 'pipette123',
        id: 'step123',
        stepType: 'moveLiquid',
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

    const result = getUnusedEntities(
      pipettesOnDeck,
      stepForms,
      'pipette',
      'OT-2 Standard'
    )

    expect(result).toEqual([pipettesOnDeck.pipette456])
  })

  it('module entities not used in steps are returned', () => {
    const stepForms: SavedStepFormState = {
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
        type: MAGNETIC_MODULE_TYPE,
        model: MAGNETIC_MODULE_V1,
        slot: '3',
        moduleState: {
          type: MAGNETIC_MODULE_TYPE,
          engaged: false,
        },
      },
      temperature456: {
        id: 'temperature456',
        type: TEMPERATURE_MODULE_TYPE,
        model: TEMPERATURE_MODULE_V1,
        moduleState: {
          type: TEMPERATURE_MODULE_TYPE,
          status: TEMPERATURE_DEACTIVATED,
          targetTemperature: null,
        },
        slot: '9',
      },
    }

    const result = getUnusedEntities(
      modulesOnDeck,
      stepForms,
      'moduleId',
      'OT-2 Standard'
    )

    expect(result).toEqual([modulesOnDeck.temperature456])
  })

  it('filters out magnetic block and shows module entities not used in steps are returned for Flex', () => {
    const stepForms: SavedStepFormState = {
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
        type: MAGNETIC_BLOCK_TYPE,
        model: MAGNETIC_BLOCK_V1,
        slot: '3',
        moduleState: {
          type: MAGNETIC_BLOCK_TYPE,
          engaged: false,
        },
      },
      temperature456: {
        id: 'temperature456',
        type: TEMPERATURE_MODULE_TYPE,
        model: TEMPERATURE_MODULE_V1,
        moduleState: {
          type: TEMPERATURE_MODULE_TYPE,
          status: TEMPERATURE_DEACTIVATED,
          targetTemperature: null,
        },
        slot: '9',
      },
    }

    const result = getUnusedEntities(
      modulesOnDeck,
      stepForms,
      'moduleId',
      'OT-3 Standard'
    )

    expect(result).toEqual([modulesOnDeck.temperature456])
  })
})
