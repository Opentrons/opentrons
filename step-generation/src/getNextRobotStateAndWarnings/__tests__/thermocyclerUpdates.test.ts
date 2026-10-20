import merge from 'lodash/merge'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { makeImmutableStateUpdater } from '../../__utils__'
import { getInitialRobotStateStandard, makeContext } from '../../fixtures'
import { forWaitForTasks as _forWaitForTasks } from '../forWaitForTasks'
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
  forThermocyclerStartRunExtendedProfile as _forThermocyclerStartRunExtendedProfile,
} from '../thermocyclerUpdates'

import type { WaitForTasksParams } from '@opentrons/shared-data'
import type { ImmutableStateUpdater } from '../../__utils__'
import type {
  InvariantContext,
  ModuleStepGenArgs,
  RobotState,
  SetTemperatureStepGenArgs,
  ThermocyclerModuleState,
  WarningType,
} from '../../types'

const forWaitForTasks = makeImmutableStateUpdater(_forWaitForTasks)
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
const forThermocyclerStartRunExtendedProfile = makeImmutableStateUpdater(
  _forThermocyclerStartRunExtendedProfile
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
  expectedWarningTypes?: WarningType[]
  moduleStateBefore: Partial<ThermocyclerModuleState>
  fn: ImmutableStateUpdater<P>
  testName: string
  runtimeParameters?: InvariantContext['runtimeParameters']
}
type TestCases<P> = Array<TestCase<P>>
describe('thermocycler state updaters', () => {
  const blockTempTestCase: TestCases<SetTemperatureStepGenArgs> = [
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
    {
      params: {
        moduleId: 'selected_module',
        celsius: 'target_temp',
      },
      runtimeParameters: {
        selected_module: {
          variableName: 'selected_module',
          displayName: 'Selected module',
          type: 'string',
          default: moduleId,
        },
        target_temp: {
          variableName: 'target_temp',
          displayName: 'Target temp',
          type: 'int',
          default: 42,
        },
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
        'forThermocyclerSetBlockTemperature should resolve runtime parameters',
    },
  ]
  const temperatureParamsCases: TestCases<SetTemperatureStepGenArgs> = [
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
        moduleId: 'selected_module',
        celsius: 'target_temp',
      },
      runtimeParameters: {
        selected_module: {
          variableName: 'selected_module',
          displayName: 'Selected module',
          type: 'string',
          default: moduleId,
        },
        target_temp: {
          variableName: 'target_temp',
          displayName: 'Target temp',
          type: 'int',
          default: 42,
        },
      },
      moduleStateBefore: {
        lidTargetTemp: null,
      },
      expectedUpdate: {
        lidTargetTemp: 42,
      },
      fn: forThermocyclerSetTargetLidTemperature,
      testName:
        'forThermocyclerSetTargetLidTemperature should resolve runtime parameters',
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
  const moduleOnlyParamsCases: TestCases<ModuleStepGenArgs> = [
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
    {
      params: {
        moduleId: 'selected_module',
      },
      runtimeParameters: {
        selected_module: {
          variableName: 'selected_module',
          displayName: 'Selected module',
          type: 'string',
          default: moduleId,
        },
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
        'forThermocyclerDeactivateBlock should resolve runtime parameters',
    },
    {
      params: {
        moduleId: 'selected_module',
      },
      runtimeParameters: {
        selected_module: {
          variableName: 'selected_module',
          displayName: 'Selected module',
          type: 'string',
          default: moduleId,
        },
      },
      moduleStateBefore: {
        lidTargetTemp: 42,
      },
      expectedUpdate: {
        lidTargetTemp: null,
      },
      fn: forThermocyclerDeactivateLid,
      testName:
        'forThermocyclerDeactivateLid should resolve runtime parameters',
    },
    {
      params: {
        moduleId: 'selected_module',
      },
      runtimeParameters: {
        selected_module: {
          variableName: 'selected_module',
          displayName: 'Selected module',
          type: 'string',
          default: moduleId,
        },
      },
      moduleStateBefore: {
        lidOpen: true,
      },
      expectedUpdate: {
        lidOpen: false,
      },
      fn: forThermocyclerCloseLid,
      testName: 'forThermocyclerCloseLid should resolve runtime parameters',
    },
    {
      params: {
        moduleId: 'selected_module',
      },
      runtimeParameters: {
        selected_module: {
          variableName: 'selected_module',
          displayName: 'Selected module',
          type: 'string',
          default: moduleId,
        },
      },
      moduleStateBefore: {
        lidOpen: false,
      },
      expectedUpdate: {
        lidOpen: true,
      },
      fn: forThermocyclerOpenLid,
      testName: 'forThermocyclerOpenLid should resolve runtime parameters',
    },
  ]
  const runProfileCases: TestCases<
    Parameters<typeof forThermocyclerRunProfile>[0]
  > = [
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
    {
      params: {
        moduleId: 'selected_module',
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
            holdSeconds: 'hold_time',
            celsius: 'target_temp',
          },
        ],
        blockMaxVolumeUl: 10,
      },
      runtimeParameters: {
        selected_module: {
          variableName: 'selected_module',
          displayName: 'Selected module',
          type: 'string',
          default: moduleId,
        },
        hold_time: {
          variableName: 'hold_time',
          displayName: 'Hold time',
          type: 'int',
          default: 10,
        },
        target_temp: {
          variableName: 'target_temp',
          displayName: 'Target temp',
          type: 'int',
          default: 20,
        },
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
      testName: 'forThermocyclerRunProfile should resolve runtime parameters',
    },
  ]
  const runExtendedProfileCases: TestCases<
    Parameters<typeof forThermocyclerRunExtendedProfile>[0]
  > = [
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
    {
      params: {
        moduleId: 'selected_module',
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
                celsius: 'target_temp',
              },
            ],
            repetitions: 'profile_reps',
          },
        ],
        blockMaxVolumeUl: 10,
      },
      runtimeParameters: {
        selected_module: {
          variableName: 'selected_module',
          displayName: 'Selected module',
          type: 'string',
          default: moduleId,
        },
        target_temp: {
          variableName: 'target_temp',
          displayName: 'Target temp',
          type: 'int',
          default: 40,
        },
        profile_reps: {
          variableName: 'profile_reps',
          displayName: 'Profile reps',
          type: 'int',
          default: 2,
        },
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
        'forThermocyclerRunExtendedProfile should resolve runtime parameters',
    },
  ]
  const startRunExtendedProfileCases: TestCases<
    Parameters<typeof forThermocyclerStartRunExtendedProfile>[0]
  > = [
    {
      params: {
        moduleId,
        profileElements: [
          {
            holdSeconds: 10,
            celsius: 20,
          },
        ],
        blockMaxVolumeUl: 10,
        taskId: 'test-task-id',
      },
      moduleStateBefore: {},
      expectedUpdate: {
        currentBlockActivity: {
          type: 'profile',
          profileElements: [
            {
              holdSeconds: 10,
              celsius: 20,
            },
          ],
          taskId: 'test-task-id',
        },
        numProfilesStarted: 1,
      },
      fn: forThermocyclerStartRunExtendedProfile,
      testName:
        'forThermocyclerStartRunExtendedProfile should populate currentBlockActivity with information about the profile',
    },
    {
      params: {
        moduleId: 'selected_module',
        profileElements: [
          {
            holdSeconds: 'hold_time',
            celsius: 'target_temp',
          },
        ],
        blockMaxVolumeUl: 10,
        taskId: 'test-task-id',
      },
      runtimeParameters: {
        selected_module: {
          variableName: 'selected_module',
          displayName: 'Selected module',
          type: 'string',
          default: moduleId,
        },
        hold_time: {
          variableName: 'hold_time',
          displayName: 'Hold time',
          type: 'int',
          default: 10,
        },
        target_temp: {
          variableName: 'target_temp',
          displayName: 'Target temp',
          type: 'int',
          default: 20,
        },
      },
      moduleStateBefore: {},
      expectedUpdate: {
        currentBlockActivity: {
          type: 'profile',
          profileElements: [
            {
              holdSeconds: 10,
              celsius: 20,
            },
          ],
          taskId: 'test-task-id',
        },
        numProfilesStarted: 1,
      },
      fn: forThermocyclerStartRunExtendedProfile,
      testName:
        'forThermocyclerStartRunExtendedProfile should resolve runtime parameters',
    },
  ]
  const waitForTasksCases: TestCases<WaitForTasksParams> = [
    {
      fn: forWaitForTasks,
      params: { task_ids: ['test-task-id'] },
      moduleStateBefore: {
        currentBlockActivity: {
          type: 'profile',
          taskId: 'test-task-id',
          profileElements: [
            {
              holdSeconds: 10,
              celsius: 100,
            },
            {
              holdSeconds: 20,
              celsius: 200,
            },
          ],
        },
      },
      expectedUpdate: {
        currentBlockActivity: {
          type: 'blockTargetTemp',
          blockTargetTemp: 200,
        },
      },
      testName:
        'Waiting for a profile task should update state to say that the profile has ended',
    },
    {
      fn: forWaitForTasks,
      params: { task_ids: ['selected_task'] },
      runtimeParameters: {
        selected_task: {
          variableName: 'selected_task',
          displayName: 'Selected task',
          type: 'string',
          default: 'test-task-id',
        },
      },
      moduleStateBefore: {
        currentBlockActivity: {
          type: 'profile',
          taskId: 'test-task-id',
          profileElements: [
            {
              holdSeconds: 10,
              celsius: 100,
            },
            {
              holdSeconds: 20,
              celsius: 200,
            },
          ],
        },
      },
      expectedUpdate: {
        currentBlockActivity: {
          type: 'blockTargetTemp',
          blockTargetTemp: 200,
        },
      },
      testName:
        'Waiting for a profile task should resolve a string runtime parameter task id',
    },
    {
      fn: forWaitForTasks,
      params: { task_ids: ['nonmatching-task-id'] },
      moduleStateBefore: {
        currentBlockActivity: {
          type: 'profile',
          taskId: 'test-task-id',
          profileElements: [
            {
              holdSeconds: 10,
              celsius: 100,
            },
            {
              holdSeconds: 20,
              celsius: 200,
            },
          ],
        },
      },
      expectedUpdate: {
        currentBlockActivity: {
          type: 'profile',
          taskId: 'test-task-id',
          profileElements: [
            {
              holdSeconds: 10,
              celsius: 100,
            },
            {
              holdSeconds: 20,
              celsius: 200,
            },
          ],
        },
      },
      expectedWarningTypes: ['WAITING_FOR_NONEXISTENT_TASK'],
      testName:
        'Waiting for an unrelated task (having a non-matching task ID) should have no effect',
    },
  ]

  const runTest = <P>({
    params,
    moduleStateBefore,
    expectedUpdate,
    expectedWarningTypes,
    fn,
    testName,
    runtimeParameters,
  }: TestCase<P>): void => {
    it(testName, () => {
      if (runtimeParameters != null) {
        invariantContext.runtimeParameters = runtimeParameters
      }
      const prevRobotState = merge({}, lidOpenRobotState, {
        modules: {
          [moduleId]: {
            moduleState: moduleStateBefore,
          },
        },
      })
      const result = fn(params, invariantContext, prevRobotState)
      expect(result.robotState).toMatchObject({
        modules: {
          [moduleId]: {
            slot: 'span7_8_10_11',
            moduleState: {
              ...lidOpenRobotState.modules[moduleId].moduleState,
              ...expectedUpdate,
            },
          },
        },
      })
      expect(
        new Set(result.warnings.map(warning => warning.type))
      ).toStrictEqual(new Set(expectedWarningTypes ?? []))
    })
  }

  blockTempTestCase.forEach(runTest)
  temperatureParamsCases.forEach(runTest)
  moduleOnlyParamsCases.forEach(runTest)
  runProfileCases.forEach(runTest)
  runExtendedProfileCases.forEach(runTest)
  startRunExtendedProfileCases.forEach(runTest)
  waitForTasksCases.forEach(runTest)
})
