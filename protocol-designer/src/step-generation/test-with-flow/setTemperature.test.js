// @flow
import {
  SPAN7_8_10_11_SLOT,
  TEMPDECK,
  THERMOCYCLER,
  TEMPERATURE_DEACTIVATED,
} from '../../constants'
import { makeStateArgsStandard, makeContext, makeState } from './fixtures'

import { setTemperature } from '../commandCreators/atomic/setTemperature'

const temperatureModuleId = 'temperatureModuleId'
const thermocyclerId = 'thermocycylerId'
const commandCreatorFnName = 'setTemperature'

let invariantContext
let robotState

beforeEach(() => {
  invariantContext = makeContext()
  invariantContext.moduleEntities = {
    [temperatureModuleId]: {
      id: temperatureModuleId,
      type: TEMPDECK,
      model: 'foo',
    },
    [thermocyclerId]: { id: thermocyclerId, type: THERMOCYCLER, model: 'foo' },
  }

  robotState = makeState({
    ...makeStateArgsStandard(),
    invariantContext,
    tiprackSetting: { tiprack1Id: true }, // TODO IMMEDIATELY: why this?
  })
  // TODO IMMEDIATELY: make this a fixture for module-related tests
  robotState.modules = {
    [temperatureModuleId]: {
      slot: '3',
      moduleState: {
        type: TEMPDECK,
        status: TEMPERATURE_DEACTIVATED,
        targetTemperature: null,
      },
    },
    [thermocyclerId]: {
      slot: SPAN7_8_10_11_SLOT,
      moduleState: {
        type: THERMOCYCLER,
        // TODO IL 2020-01-14 create this state when thermocycler state is implemented
      },
    },
  }
})

describe('setTemperature', () => {
  const targetTemperature = 42
  const missingModuleError = {
    errors: [{ message: expect.any(String), type: 'MISSING_MODULE' }],
  }

  const testCases = [
    {
      testName: 'temperature module',
      moduleId: temperatureModuleId,
      expected: {
        commands: [
          {
            command: 'temperatureModule/setTargetTemperature',
            params: {
              module: temperatureModuleId,
              temperature: targetTemperature,
            },
          },
        ],
      },
    },
    {
      testName: 'no such moduleId',
      moduleId: 'someNonexistentModuleId',
      expected: missingModuleError,
    },
    {
      testName: 'null moduleId',
      moduleId: null,
      expected: missingModuleError,
    },
    {
      testName: 'thermocycler',
      moduleId: thermocyclerId,
      expected: {
        commands: [
          {
            command: 'thermocycler/setTargetTemperature',
            params: {
              module: thermocyclerId,
              temperature: targetTemperature,
            },
          },
        ],
      },
    },
  ]

  testCases.forEach(({ expected, moduleId, testName }) => {
    test(testName, () => {
      const args = { module: moduleId, targetTemperature, commandCreatorFnName }
      const result = setTemperature(args, invariantContext, robotState)
      expect(result).toEqual(expected)
    })
  })
})
