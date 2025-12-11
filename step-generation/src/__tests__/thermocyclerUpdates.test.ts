import merge from 'lodash/merge'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { makeImmutableStateUpdater } from '../__utils__'
import { getInitialRobotStateStandard, makeContext } from '../fixtures'
import {
  forThermocyclerAwaitBlockTemperature as _forThermocyclerAwaitBlockTemperature,
  forThermocyclerAwaitLidTemperature as _forThermocyclerAwaitLidTemperature,
  forThermocyclerCloseLid as _forThermocyclerCloseLid,
  forThermocyclerDeactivateBlock as _forThermocyclerDeactivateBlock,
  forThermocyclerDeactivateLid as _forThermocyclerDeactivateLid,
  forThermocyclerOpenLid as _forThermocyclerOpenLid,
  forThermocyclerRunExtendedProfile as _forThermocyclerRunExtendedProfile,
  forThermocyclerRunProfile as _forThermocyclerRunProfile,
  forThermocyclerSetTargetBlockTemperature as _forThermocyclerSetTargetBlockTemperature,
  forThermocyclerSetTargetLidTemperature as _forThermocyclerSetTargetLidTemperature,
} from '../getNextRobotStateAndWarnings/thermocyclerUpdates'

import type { TCExtendedProfileParams } from '@opentrons/shared-data'
import type {
  ModuleOnlyParams,
  TCProfileParams,
  TemperatureParams,
  ThermocyclerSetTargetBlockTemperatureParams,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type { ImmutableStateUpdater } from '../__utils__'
import type {
  InvariantContext,
  RobotState,
  ThermocyclerModuleState,
} from '../types'

const forThermocyclerSetTargetBlockTemperature = makeImmutableStateUpdater(
  _forThermocyclerSetTargetBlockTemperature
)
const forThermocyclerSetTargetLidTemperature = makeImmutableStateUpdater(
  _forThermocyclerSetTargetLidTemperature
)
const forThermocyclerAwaitBlockTemperature = makeImmutableStateUpdater(
  _forThermocyclerAwaitBlockTemperature
)
const forThermocyclerAwaitLidTemperature = makeImmutableStateUpdater(
  _forThermocyclerAwaitLidTemperature
)
const forThermocyclerDeactivateBlock = makeImmutableStateUpdater(
  _forThermocyclerDeactivateBlock
)
const forThermocyclerDeactivateLid = makeImmutableStateUpdater(
  _forThermocyclerDeactivateLid
)
const forThermocyclerCloseLid = makeImmutableStateUpdater(
  _forThermocyclerCloseLid
)
const forThermocyclerOpenLid = makeImmutableStateUpdater(
  _forThermocyclerOpenLid
)
const forThermocyclerRunProfile = makeImmutableStateUpdater(
  _forThermocyclerRunProfile
)
const forThermocyclerRunExtendedProfile = makeImmutableStateUpdater(
  _forThermocyclerRunExtendedProfile
)

const moduleId = 'thermocyclerModuleId'
let invariantContext: InvariantContext
let lidOpenRobotState: RobotState
beforeEach(() => {
  invariantContext = makeContext()
  invariantContext.moduleEntities[moduleId] = {
    id: moduleId,
    type: THERMOCYCLER_MODULE_TYPE,
    model: THERMOCYCLER_MODULE_V1,
    pythonName: 'mockPythonName',
  }
  lidOpenRobotState = getInitialRobotStateStandard(invariantContext)
  lidOpenRobotState.modules[moduleId] = {
    slot: 'span7_8_10_11',
    moduleState: {
      type: THERMOCYCLER_MODULE_TYPE,
      lidOpen: true,
      lidTargetTemp: null,
      currentBlockActivity: { type: 'blockDeactivated' },
      numProfilesStarted: 0,
    },
  }
})
interface TestCase<P> {
  params: P
  expectedUpdate: Partial<ThermocyclerModuleState>
  moduleStateBefore: Partial<ThermocyclerModuleState>
  fn: ImmutableStateUpdater<P>
  testName: string
}
type TestCases<P> = Array<TestCase<P>>
describe('thermocycler state updaters', () => {
  const blockTempTestCase: TestCases<ThermocyclerSetTargetBlockTemperatureParams> =
    [
      {
        params: {
          moduleId,
          celsius: 42,
        },
        moduleStateBefore: {
          currentBlockActivity: {
            type: 'blockDeactivated',
          },
        },
        expectedUpdate: {
          currentBlockActivity: {
            type: 'blockTargetTemp',
            blockTargetTemp: 42,
          },
        },
        fn: forThermocyclerSetTargetBlockTemperature,
        testName:
          'forThermocyclerSetBlockTemperature should update the block temp',
      },
    ]
  const temperatureParamsCases: TestCases<TemperatureParams> = [
    {
      params: {
        moduleId,
        celsius: 42,
      },
      moduleStateBefore: {
        lidTargetTemp: null,
      },
      expectedUpdate: {
        lidTargetTemp: 42,
      },
      fn: forThermocyclerSetTargetLidTemperature,
      testName:
        'forThermocyclerSetTargetLidTemperature should update the lid temp',
    },
    {
      params: {
        moduleId,
        celsius: 42,
      },
      moduleStateBefore: {
        lidTargetTemp: 41,
        currentBlockActivity: {
          type: 'blockTargetTemp',
          blockTargetTemp: 42,
        },
        lidOpen: true,
      },
      expectedUpdate: {
        lidTargetTemp: 41,
        currentBlockActivity: {
          type: 'blockTargetTemp',
          blockTargetTemp: 42,
        },
        lidOpen: true,
      },
      fn: forThermocyclerAwaitBlockTemperature,
      testName: 'forThermocyclerAwaitBlockTemperature should do nothing',
    },
    {
      params: {
        moduleId,
        celsius: 41,
      },
      moduleStateBefore: {
        lidTargetTemp: 41,
        currentBlockActivity: {
          type: 'blockTargetTemp',
          blockTargetTemp: 42,
        },
        lidOpen: true,
      },
      expectedUpdate: {
        lidTargetTemp: 41,
        currentBlockActivity: {
          type: 'blockTargetTemp',
          blockTargetTemp: 42,
        },
        lidOpen: true,
      },
      fn: forThermocyclerAwaitLidTemperature,
      testName: 'forThermocyclerAwaitLidTemperature should do nothing',
    },
  ]
  const moduleOnlyParamsCases: TestCases<ModuleOnlyParams> = [
    {
      params: {
        moduleId,
      },
      moduleStateBefore: {
        currentBlockActivity: {
          type: 'blockTargetTemp',
          blockTargetTemp: 42,
        },
      },
      expectedUpdate: {
        currentBlockActivity: {
          type: 'blockDeactivated',
        },
      },
      fn: forThermocyclerDeactivateBlock,
      testName:
        'forThermocyclerDeactivateBlock should set blockTargetTemp to null',
    },
    {
      params: {
        moduleId,
      },
      moduleStateBefore: {
        lidTargetTemp: 42,
      },
      expectedUpdate: {
        lidTargetTemp: null,
      },
      fn: forThermocyclerDeactivateLid,
      testName: 'forThermocyclerDeactivateLid should set lidTargetTemp to null',
    },
    {
      params: {
        moduleId,
      },
      moduleStateBefore: {
        lidOpen: true,
      },
      expectedUpdate: {
        lidOpen: false,
      },
      fn: forThermocyclerCloseLid,
      testName: 'forThermocyclerCloseLid should set lidOpen to false',
    },
    {
      params: {
        moduleId,
      },
      moduleStateBefore: {
        lidOpen: false,
      },
      expectedUpdate: {
        lidOpen: true,
      },
      fn: forThermocyclerOpenLid,
      testName: 'forThermocyclerOpenLid should set lidOpen to true',
    },
  ]
  const runProfileCases: TestCases<TCProfileParams> = [
    {
      params: {
        moduleId,
        profile: [],
        blockMaxVolumeUl: 10,
      },
      moduleStateBefore: {},
      expectedUpdate: { numProfilesStarted: 1 },
      fn: forThermocyclerRunProfile,
      testName:
        'forThermocyclerRunProfile should not make any block or lid updates',
    },
    {
      params: {
        moduleId,
        profile: [
          {
            holdSeconds: 10,
            celsius: 0,
          },
          {
            holdSeconds: 10,
            celsius: 50,
          },
          {
            holdSeconds: 10,
            celsius: 20,
          },
        ],
        blockMaxVolumeUl: 10,
      },
      moduleStateBefore: {
        currentBlockActivity: {
          type: 'blockTargetTemp',
          blockTargetTemp: 42,
        },
      },
      expectedUpdate: {
        currentBlockActivity: {
          type: 'blockTargetTemp',
          blockTargetTemp: 20,
        },
        numProfilesStarted: 1,
      },
      fn: forThermocyclerRunProfile,
      testName:
        'forThermocyclerRunProfile should set blockTargetTemp from the last profile step',
    },
  ]
  const runExtendedProfileCases: TestCases<TCExtendedProfileParams> = [
    {
      params: {
        moduleId,
        profileElements: [],
        blockMaxVolumeUl: 10,
      },
      moduleStateBefore: {},
      expectedUpdate: { numProfilesStarted: 1 },
      fn: forThermocyclerRunExtendedProfile,
      testName:
        'forThermocyclerRunExtendedProfile should not make any block or lid updates',
    },
    {
      params: {
        moduleId,
        profileElements: [
          {
            holdSeconds: 10,
            celsius: 50,
          },
          {
            steps: [
              {
                holdSeconds: 10,
                celsius: 30,
              },
              {
                holdSeconds: 10,
                celsius: 40,
              },
            ],
            repetitions: 2,
          },
        ],
        blockMaxVolumeUl: 10,
      },
      moduleStateBefore: {
        currentBlockActivity: {
          type: 'blockTargetTemp',
          blockTargetTemp: 0,
        },
      },
      expectedUpdate: {
        currentBlockActivity: {
          type: 'blockTargetTemp',
          blockTargetTemp: 40,
        },
        numProfilesStarted: 1,
      },
      fn: forThermocyclerRunExtendedProfile,
      testName:
        'forThermocyclerRunExtendedProfile should set blockTargetTemp from the last profile step',
    },
  ]

  const runTest = <P>({
    params,
    moduleStateBefore,
    expectedUpdate,
    fn,
    testName,
  }: TestCase<P>): void => {
    it(testName, () => {
      const prevRobotState = merge({}, lidOpenRobotState, {
        modules: {
          [moduleId]: {
            moduleState: moduleStateBefore,
          },
        },
      })
      const result = fn(params, invariantContext, prevRobotState)
      expect(result).toMatchObject({
        robotState: {
          modules: {
            [moduleId]: {
              slot: 'span7_8_10_11',
              moduleState: {
                ...lidOpenRobotState.modules[moduleId].moduleState,
                ...expectedUpdate,
              },
            },
          },
        },
        warnings: [],
      })
    })
  }

  blockTempTestCase.forEach(runTest)
  temperatureParamsCases.forEach(runTest)
  moduleOnlyParamsCases.forEach(runTest)
  runProfileCases.forEach(runTest)
  runExtendedProfileCases.forEach(runTest)
})
