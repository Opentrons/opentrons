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
  moduleEntities: {
    [module]: {
      id: module,
      type: 'thermocyclerModuleType',
      model: 'thermocyclerModuleV1',
      pythonName: 'mock_thermocycler',
    },
  } as ModuleEntities,
  runtimeParameters: {},
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
})
describe('thermocycler atomic commands with runtime parameters', () => {
  const moduleOnlyTestCases = [
    {
      commandCreator: thermocyclerCloseLid,
      expectedType: 'thermocycler/closeLid',
      expectedPython: 'mock_thermocycler.close_lid()',
    },
    {
      commandCreator: thermocyclerOpenLid,
      expectedType: 'thermocycler/openLid',
      expectedPython: 'mock_thermocycler.open_lid()',
    },
    {
      commandCreator: thermocyclerDeactivateBlock,
      expectedType: 'thermocycler/deactivateBlock',
      expectedPython: 'mock_thermocycler.deactivate_block()',
    },
    {
      commandCreator: thermocyclerDeactivateLid,
      expectedType: 'thermocycler/deactivateLid',
      expectedPython: 'mock_thermocycler.deactivate_lid()',
    },
  ]

  moduleOnlyTestCases.forEach(
    ({ commandCreator, expectedType, expectedPython }) => {
      it(`resolves moduleId for "${expectedType}" when it is a string runtime parameter`, () => {
        const result = commandCreator(
          {
            moduleId: 'selected_module',
          },
          {
            ...invariantContext,
            runtimeParameters: {
              selected_module: {
                variableName: 'selected_module',
                displayName: 'Selected module',
                type: 'string',
                default: module,
              },
            },
          },
          { ...getRobotInitialState(), labware: {} }
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
          python: expectedPython,
        })
      })
      it(`returns error for "${expectedType}" if moduleId is not a string runtime parameter`, () => {
        const result = commandCreator(
          {
            moduleId: 'mock_rtp',
          },
          {
            ...invariantContext,
            runtimeParameters: {
              mock_rtp: {
                variableName: 'mock_rtp',
                displayName: 'mock rtp',
                type: 'boolean',
                default: false,
              },
            },
          },
          { ...getRobotInitialState(), labware: {} }
        )
        expect(getErrorResult(result).errors).toEqual([
          {
            message: 'Runtime parameter "mock_rtp" is missing',
            type: 'INVALID_RUNTIME_PARAMETER',
          },
        ])
      })
    }
  )

  const temperatureTestCases = [
    {
      commandCreator: thermocyclerSetTargetBlockTemperature,
      expectedType: 'thermocycler/setTargetBlockTemperature',
      expectedPython:
        'mock_thermocycler.set_block_temperature(target_temperature)',
    },
    {
      commandCreator: thermocyclerSetTargetLidTemperature,
      expectedType: 'thermocycler/setTargetLidTemperature',
      expectedPython:
        'mock_thermocycler.set_lid_temperature(target_temperature)',
    },
  ]

  temperatureTestCases.forEach(
    ({ commandCreator, expectedType, expectedPython }) => {
      it(`resolves moduleId and celsius for "${expectedType}" when they are runtime parameters`, () => {
        const result = commandCreator(
          {
            moduleId: 'selected_module',
            celsius: 'target_temperature',
          },
          {
            ...invariantContext,
            runtimeParameters: {
              selected_module: {
                variableName: 'selected_module',
                displayName: 'Selected module',
                type: 'string',
                default: module,
              },
              target_temperature: {
                variableName: 'target_temperature',
                displayName: 'Target temperature',
                type: 'float',
                default: temperature,
              },
            },
          },
          { ...getRobotInitialState(), labware: {} }
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
          python: expectedPython,
        })
      })
      it(`returns errors for "${expectedType}" if runtime parameters are missing or invalid`, () => {
        const result = commandCreator(
          {
            moduleId: 'mock_rtp',
            celsius: 'missing_temperature',
          },
          {
            ...invariantContext,
            runtimeParameters: {
              mock_rtp: {
                variableName: 'mock_rtp',
                displayName: 'mock rtp',
                type: 'boolean',
                default: false,
              },
            },
          },
          { ...getRobotInitialState(), labware: {} }
        )
        expect(getErrorResult(result).errors).toEqual([
          {
            message: 'Runtime parameter "mock_rtp" is missing',
            type: 'INVALID_RUNTIME_PARAMETER',
          },
          {
            message: 'Runtime parameter "missing_temperature" is missing',
            type: 'INVALID_RUNTIME_PARAMETER',
          },
        ])
      })
    }
  )

  const profileRuntimeParameters = {
    selected_module: {
      variableName: 'selected_module',
      displayName: 'Selected module',
      type: 'string',
      default: module,
    },
    profile_temperature: {
      variableName: 'profile_temperature',
      displayName: 'Profile temperature',
      type: 'float',
      default: temperature,
    },
    profile_hold_time: {
      variableName: 'profile_hold_time',
      displayName: 'Profile hold time',
      type: 'int',
      default: holdTime,
    },
    profile_repetitions: {
      variableName: 'profile_repetitions',
      displayName: 'Profile repetitions',
      type: 'int',
      default: 2,
    },
    block_volume: {
      variableName: 'block_volume',
      displayName: 'Block volume',
      type: 'float',
      default: volume,
    },
  }

  it('resolves all args for "thermocycler/startRunExtendedProfile" when they are runtime parameters', () => {
    const result = thermocyclerStartRunExtendedProfile(
      {
        moduleId: 'selected_module',
        profileElements: [
          {
            steps: [
              {
                celsius: 'profile_temperature',
                holdSeconds: 'profile_hold_time',
              },
            ],
            repetitions: 'profile_repetitions',
          },
        ],
        blockMaxVolumeUl: 'block_volume',
      },
      { ...invariantContext, runtimeParameters: profileRuntimeParameters },
      { ...getRobotInitialState(), labware: {} }
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'thermocycler/startRunExtendedProfile',
          key: expect.any(String),
          params: {
            moduleId: module,
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
      python: `
mock_thermocycler.start_execute_profile(
    [
        {"temperature": profile_temperature, "hold_time_seconds": profile_hold_time},
    ],
    profile_repetitions,
    block_max_volume=block_volume,
)
`.trim(),
    })
  })
  it('unrolls resolved repetitions in python for "thermocycler/startRunExtendedProfile" with multiple profile elements', () => {
    const result = thermocyclerStartRunExtendedProfile(
      {
        moduleId: module,
        profileElements: [
          {
            steps: [
              {
                celsius: 'profile_temperature',
                holdSeconds: holdTime,
              },
            ],
            repetitions: 'profile_repetitions',
          },
          {
            celsius: temperature,
            holdSeconds: 'profile_hold_time',
          },
        ],
        blockMaxVolumeUl: volume,
      },
      { ...invariantContext, runtimeParameters: profileRuntimeParameters },
      { ...getRobotInitialState(), labware: {} }
    )
    expect(getSuccessResult(result).python).toBe(
      `
mock_thermocycler.start_execute_profile(
    [
        {"temperature": profile_temperature, "hold_time_seconds": 10},
        {"temperature": profile_temperature, "hold_time_seconds": 10},
        {"temperature": 42, "hold_time_seconds": profile_hold_time},
    ],
    1,
    block_max_volume=10,
)
`.trim()
    )
  })
  it('returns errors for "thermocycler/startRunExtendedProfile" if runtime parameters are missing or invalid', () => {
    const result = thermocyclerStartRunExtendedProfile(
      {
        moduleId: module,
        profileElements: [
          {
            steps: [
              {
                celsius: 'missing_temperature',
                holdSeconds: holdTime,
              },
            ],
            repetitions: 'mock_rtp',
          },
        ],
        blockMaxVolumeUl: 'missing_volume',
      },
      {
        ...invariantContext,
        runtimeParameters: {
          mock_rtp: {
            variableName: 'mock_rtp',
            displayName: 'mock rtp',
            type: 'boolean',
            default: false,
          },
        },
      },
      { ...getRobotInitialState(), labware: {} }
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "missing_temperature" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "missing_volume" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
