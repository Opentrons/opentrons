import { describe, expect, it } from 'vitest'

import { getErrorResult, getSuccessResult } from '../../../fixtures'
import { thermocyclerCloseLid } from '../thermocyclerCloseLid'
import { thermocyclerDeactivateBlock } from '../thermocyclerDeactivateBlock'
import { thermocyclerDeactivateLid } from '../thermocyclerDeactivateLid'
import { thermocyclerOpenLid } from '../thermocyclerOpenLid'
import { thermocyclerSetTargetBlockTemperature } from '../thermocyclerSetTargetBlockTemperature'
import { thermocyclerSetTargetLidTemperature } from '../thermocyclerSetTargetLidTemperature'
import { thermocyclerStartRunExtendedProfile } from '../thermocyclerStartRunExtendedProfile'

import type { TCExtendedProfileParams } from '@opentrons/shared-data'
import type {
  ModuleOnlyParams,
  TemperatureParams,
} from '@opentrons/shared-data/protocol/types/schemaV4'
import type { CommandCreator, ModuleEntities } from '../../../types'

const getRobotInitialState = (): any => {
  // This particular state shouldn't matter for these command creators
  return {}
}

// neither should InvariantContext
let invariantContext: any = {}
const module: ModuleOnlyParams['module'] = 'someTCModuleId'
const temperature: TemperatureParams['temperature'] = 42
const holdTime = 10
const volume = 10
const profileElements: TCExtendedProfileParams['profileElements'] = [
  {
    celsius: temperature,
    holdSeconds: holdTime,
  },
]
invariantContext = {
  ...invariantContext,
  runtimeParameters: {},
  moduleEntities: {
    [module]: {
      id: module,
      type: 'thermocyclerModuleType',
      model: 'thermocyclerModuleV1',
      pythonName: 'mock_thermocycler',
    },
  } as ModuleEntities,
}
describe('thermocycler atomic commands', () => {
  const testCases = [
    {
      commandCreator: thermocyclerSetTargetBlockTemperature,
      expectedType: 'thermocycler/setTargetBlockTemperature',
      params: {
        moduleId: module,
        celsius: temperature,
      },
    },
    {
      commandCreator: thermocyclerSetTargetLidTemperature,
      expectedType: 'thermocycler/setTargetLidTemperature',
      params: {
        moduleId: module,
        celsius: temperature,
      },
    },
    {
      commandCreator: thermocyclerDeactivateBlock,
      expectedType: 'thermocycler/deactivateBlock',
      params: {
        moduleId: module,
      },
    },
    {
      commandCreator: thermocyclerDeactivateLid,
      expectedType: 'thermocycler/deactivateLid',
      params: {
        moduleId: module,
      },
    },
    {
      commandCreator: thermocyclerCloseLid,
      expectedType: 'thermocycler/closeLid',
      params: {
        moduleId: module,
      },
    },
    {
      commandCreator: thermocyclerOpenLid,
      expectedType: 'thermocycler/openLid',
      params: {
        moduleId: module,
      },
    },
    {
      commandCreator: thermocyclerStartRunExtendedProfile,
      expectedType: 'thermocycler/startRunExtendedProfile',
      params: {
        moduleId: module,
        profileElements,
        blockMaxVolumeUl: volume,
        taskId: 'test-task-id',
      },
    },
  ]

  const testParams = ({
    commandCreator,
    params,
    expectedType,
  }: {
    commandCreator: CommandCreator<any>
    params: any
    expectedType: string
  }): void => {
    it(`creates a single "${expectedType}" command with the given params`, () => {
      const robotInitialState = {
        ...getRobotInitialState(),
        labware: {},
      }

      // Use params directly from the test case
      const result = commandCreator(params, invariantContext, robotInitialState)
      const res = getSuccessResult(result)

      expect(res.commands).toEqual([
        {
          commandType: expectedType,
          key: expect.any(String),
          params,
        },
      ])
    })
  }

  testCases.forEach(testParams)

  const moduleOnlyCases = [
    {
      commandCreator: thermocyclerDeactivateBlock,
      expectedType: 'thermocycler/deactivateBlock',
      python: 'mock_thermocycler.deactivate_block()',
    },
    {
      commandCreator: thermocyclerDeactivateLid,
      expectedType: 'thermocycler/deactivateLid',
      python: 'mock_thermocycler.deactivate_lid()',
    },
    {
      commandCreator: thermocyclerCloseLid,
      expectedType: 'thermocycler/closeLid',
      python: 'mock_thermocycler.close_lid()',
    },
    {
      commandCreator: thermocyclerOpenLid,
      expectedType: 'thermocycler/openLid',
      python: 'mock_thermocycler.open_lid()',
    },
  ]
  moduleOnlyCases.forEach(({ commandCreator, expectedType, python }) => {
    it(`resolves moduleId when it is a string runtime parameter for ${expectedType}`, () => {
      invariantContext.runtimeParameters = {
        selected_module: {
          variableName: 'selected_module',
          displayName: 'Selected module',
          type: 'string',
          default: module,
        },
      }
      const result = commandCreator(
        { moduleId: 'selected_module' },
        invariantContext,
        { labware: {} }
      )
      expect(result).toEqual({
        commands: [
          {
            commandType: expectedType,
            key: expect.any(String),
            params: {
              moduleId: module,
            },
          },
        ],
        python,
      })
    })
    it(`returns error if moduleId is not a string runtime parameter for ${expectedType}`, () => {
      invariantContext.runtimeParameters = {
        mock_rtp: {
          variableName: 'mock_rtp',
          displayName: 'mock rtp',
          type: 'boolean',
          default: false,
        },
      }
      const result = commandCreator(
        { moduleId: 'mock_rtp' },
        invariantContext,
        { labware: {} }
      )
      expect(getErrorResult(result).errors).toEqual([
        {
          message: 'Runtime parameter "mock_rtp" is missing',
          type: 'INVALID_RUNTIME_PARAMETER',
        },
      ])
    })
  })

  const temperatureCases = [
    {
      commandCreator: thermocyclerSetTargetBlockTemperature,
      expectedType: 'thermocycler/setTargetBlockTemperature',
      python: 'mock_thermocycler.set_block_temperature(target_temp)',
    },
    {
      commandCreator: thermocyclerSetTargetLidTemperature,
      expectedType: 'thermocycler/setTargetLidTemperature',
      python: 'mock_thermocycler.set_lid_temperature(target_temp)',
    },
  ]
  temperatureCases.forEach(({ commandCreator, expectedType, python }) => {
    it(`resolves moduleId and celsius when they are runtime parameters for ${expectedType}`, () => {
      invariantContext.runtimeParameters = {
        selected_module: {
          variableName: 'selected_module',
          displayName: 'Selected module',
          type: 'string',
          default: module,
        },
        target_temp: {
          variableName: 'target_temp',
          displayName: 'Target temp',
          type: 'int',
          default: temperature,
        },
      }
      const result = commandCreator(
        {
          moduleId: 'selected_module',
          celsius: 'target_temp',
        },
        invariantContext,
        { labware: {} }
      )
      expect(result).toEqual({
        commands: [
          {
            commandType: expectedType,
            key: expect.any(String),
            params: {
              moduleId: module,
              celsius: temperature,
            },
          },
        ],
        python,
      })
    })
    it(`returns errors if moduleId and celsius are not valid runtime parameters for ${expectedType}`, () => {
      invariantContext.runtimeParameters = {
        mock_rtp: {
          variableName: 'mock_rtp',
          displayName: 'mock rtp',
          type: 'boolean',
          default: false,
        },
        mock_string_rtp: {
          variableName: 'mock_string_rtp',
          displayName: 'mock string rtp',
          type: 'string',
          default: 'mock',
        },
      }
      const result = commandCreator(
        {
          moduleId: 'mock_rtp',
          celsius: 'mock_string_rtp',
        },
        invariantContext,
        { labware: {} }
      )
      expect(getErrorResult(result).errors).toEqual([
        {
          message: 'Runtime parameter "mock_rtp" is missing',
          type: 'INVALID_RUNTIME_PARAMETER',
        },
        {
          message: 'Runtime parameter "mock_string_rtp" is missing',
          type: 'INVALID_RUNTIME_PARAMETER',
        },
      ])
    })
  })
  it('resolves runtime parameters into the command and python', () => {
    invariantContext.runtimeParameters = {
      selected_module: {
        variableName: 'selected_module',
        displayName: 'Selected module',
        type: 'string',
        default: module,
      },
      block_temp: {
        variableName: 'block_temp',
        displayName: 'Block temp',
        type: 'int',
        default: temperature,
      },
      hold_time: {
        variableName: 'hold_time',
        displayName: 'Hold time',
        type: 'int',
        default: holdTime,
      },
      block_volume: {
        variableName: 'block_volume',
        displayName: 'Block volume',
        type: 'int',
        default: volume,
      },
      task_name: {
        variableName: 'task_name',
        displayName: 'Task name',
        type: 'string',
        default: 'profile_task',
      },
      repetitions: {
        variableName: 'repetitions',
        displayName: 'Repetitions',
        type: 'int',
        default: 2,
      },
    }
    const result = thermocyclerStartRunExtendedProfile(
      {
        moduleId: 'selected_module',
        profileElements: [
          {
            steps: [{ celsius: 'block_temp', holdSeconds: 'hold_time' }],
            repetitions: 'repetitions',
          },
        ],
        blockMaxVolumeUl: 'block_volume',
        taskId: 'task_name',
      },
      invariantContext,
      { labware: {} }
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'thermocycler/startRunExtendedProfile',
          key: expect.any(String),
          params: {
            moduleId: module,
            taskId: 'profile_task',
            profileElements: [
              {
                steps: [{ celsius: temperature, holdSeconds: holdTime }],
                repetitions: 2,
              },
            ],
            blockMaxVolumeUl: volume,
          },
        },
      ],
      python: `task_name = mock_thermocycler.start_execute_profile(
    [
        {"temperature": block_temp, "hold_time_seconds": hold_time},
    ],
    repetitions,
    block_max_volume=block_volume,
)`,
    })
  })
  it('returns errors if profile runtime parameters are not valid', () => {
    invariantContext.runtimeParameters = {
      mock_rtp: {
        variableName: 'mock_rtp',
        displayName: 'mock rtp',
        type: 'boolean',
        default: false,
      },
      mock_string_rtp: {
        variableName: 'mock_string_rtp',
        displayName: 'mock string rtp',
        type: 'string',
        default: 'mock',
      },
    }
    const result = thermocyclerStartRunExtendedProfile(
      {
        moduleId: 'mock_rtp',
        profileElements: [
          { celsius: 'mock_string_rtp', holdSeconds: 'mock_rtp' },
        ],
        blockMaxVolumeUl: 'mock_string_rtp',
        taskId: 'mock_rtp',
      },
      invariantContext,
      { labware: {} }
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
