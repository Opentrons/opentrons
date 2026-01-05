import { describe, expect, it } from 'vitest'

import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'

import {
  getErrorResult,
  getStateAndContextTempTCModules,
  getSuccessResult,
} from '../../../fixtures'
import { thermocyclerProfileStep } from '../thermocyclerProfileStep'

import type { CreateCommand } from '@opentrons/shared-data/command'
import type {
  ThermocyclerModuleState,
  ThermocyclerProfileStepArgs,
} from '../../../types'

const temperatureModuleId = 'temperatureModuleId'
const thermocyclerId = 'thermocyclerId'

describe('thermocyclerProfileStep with concurrent=false', () => {
  const testCases: Array<{
    testName: string
    initialThermocyclerModuleState?: ThermocyclerModuleState
    args: ThermocyclerProfileStepArgs
    expected: CreateCommand[]
    expectedPython: string
  }> = [
    {
      testName: 'should generate expected commands',
      args: {
        commandCreatorFnName: 'thermocyclerProfile',
        blockTargetTempHold: 4,
        lidTargetTempHold: null,
        lidOpenHold: true,
        moduleId: thermocyclerId,
        profileElements: [
          {
            repetitions: 4,
            steps: [
              { celsius: 30, holdSeconds: 10 },
              { celsius: 40, holdSeconds: 20 },
            ],
          },
        ],
        profileTargetLidTemp: 55,
        profileVolume: 42,
        concurrent: false,
      },
      expected: [
        {
          commandType: 'thermocycler/closeLid',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
          },
        },
        {
          commandType: 'thermocycler/setTargetLidTemperature',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
            celsius: 55,
          },
        },
        {
          commandType: 'thermocycler/runExtendedProfile',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
            profileElements: [
              {
                repetitions: 4,
                steps: [
                  { celsius: 30, holdSeconds: 10 },
                  { celsius: 40, holdSeconds: 20 },
                ],
              },
            ],
            blockMaxVolumeUl: 42,
          },
        },
        {
          commandType: 'thermocycler/openLid',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
          },
        },
        {
          commandType: 'thermocycler/setTargetBlockTemperature',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
            celsius: 4,
          },
        },
        {
          commandType: 'thermocycler/deactivateLid',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
          },
        },
      ],
      expectedPython: `
mock_thermocycler.close_lid()
mock_thermocycler.set_lid_temperature(55)
mock_thermocycler.execute_profile(
    [
        {"temperature": 30, "hold_time_seconds": 10},
        {"temperature": 40, "hold_time_seconds": 20},
    ],
    4,
    block_max_volume=42,
)
mock_thermocycler.open_lid()
mock_thermocycler.set_block_temperature(4)
mock_thermocycler.deactivate_lid()`.trimStart(),
    },
    {
      testName:
        'should omit the setTargetLidTemperature when lid temp is already at desired temp',
      initialThermocyclerModuleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        currentBlockActivity: { type: 'blockDeactivated' },
        lidTargetTemp: 55,
        lidOpen: false,
        numProfilesStarted: 0,
      },
      args: {
        commandCreatorFnName: 'thermocyclerProfile',
        blockTargetTempHold: 4,
        lidTargetTempHold: null,
        lidOpenHold: true,
        moduleId: thermocyclerId,
        profileElements: [{ celsius: 61, holdSeconds: 99 }],
        profileTargetLidTemp: 55,
        profileVolume: 42,
        concurrent: false,
      },
      expected: [
        {
          commandType: 'thermocycler/runExtendedProfile',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
            profileElements: [{ celsius: 61, holdSeconds: 99 }],
            blockMaxVolumeUl: 42,
          },
        },
        {
          commandType: 'thermocycler/openLid',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
          },
        },
        {
          commandType: 'thermocycler/setTargetBlockTemperature',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
            celsius: 4,
          },
        },
        {
          commandType: 'thermocycler/deactivateLid',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
          },
        },
      ],
      expectedPython: `
mock_thermocycler.execute_profile(
    [
        {"temperature": 61, "hold_time_seconds": 99},
    ],
    1,
    block_max_volume=42,
)
mock_thermocycler.open_lid()
mock_thermocycler.set_block_temperature(4)
mock_thermocycler.deactivate_lid()`.trimStart(),
    },
    {
      testName:
        'should close the lid before running the profile if the lid open state is null',
      initialThermocyclerModuleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        currentBlockActivity: { type: 'blockDeactivated' },
        lidTargetTemp: 55,
        lidOpen: null,
        numProfilesStarted: 0,
      },
      args: {
        commandCreatorFnName: 'thermocyclerProfile',
        blockTargetTempHold: 4,
        lidTargetTempHold: null,
        lidOpenHold: true,
        moduleId: thermocyclerId,
        profileElements: [{ celsius: 61, holdSeconds: 99 }],
        profileTargetLidTemp: 55,
        profileVolume: 42,
        concurrent: false,
      },
      expected: [
        {
          commandType: 'thermocycler/closeLid',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
          },
        },
        {
          commandType: 'thermocycler/runExtendedProfile',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
            profileElements: [{ celsius: 61, holdSeconds: 99 }],
            blockMaxVolumeUl: 42,
          },
        },
        {
          commandType: 'thermocycler/openLid',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
          },
        },
        {
          commandType: 'thermocycler/setTargetBlockTemperature',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
            celsius: 4,
          },
        },
        {
          commandType: 'thermocycler/deactivateLid',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
          },
        },
      ],
      expectedPython: `
mock_thermocycler.close_lid()
mock_thermocycler.execute_profile(
    [
        {"temperature": 61, "hold_time_seconds": 99},
    ],
    1,
    block_max_volume=42,
)
mock_thermocycler.open_lid()
mock_thermocycler.set_block_temperature(4)
mock_thermocycler.deactivate_lid()`.trimStart(),
    },
    {
      testName:
        'should omit the closeLid when the lid open state is false before running a profile',
      initialThermocyclerModuleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        currentBlockActivity: { type: 'blockDeactivated' },
        lidTargetTemp: 55,
        lidOpen: false,
        numProfilesStarted: 0,
      },
      args: {
        commandCreatorFnName: 'thermocyclerProfile',
        blockTargetTempHold: 4,
        lidTargetTempHold: null,
        lidOpenHold: true,
        moduleId: thermocyclerId,
        profileElements: [{ celsius: 61, holdSeconds: 99 }],
        profileTargetLidTemp: 55,
        profileVolume: 42,
        concurrent: false,
      },
      expected: [
        {
          commandType: 'thermocycler/runExtendedProfile',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
            profileElements: [{ celsius: 61, holdSeconds: 99 }],
            blockMaxVolumeUl: 42,
          },
        },
        {
          commandType: 'thermocycler/openLid',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
          },
        },
        {
          commandType: 'thermocycler/setTargetBlockTemperature',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
            celsius: 4,
          },
        },
        {
          commandType: 'thermocycler/deactivateLid',
          key: expect.any(String),
          params: {
            moduleId: 'thermocyclerId',
          },
        },
      ],
      expectedPython: `
mock_thermocycler.execute_profile(
    [
        {"temperature": 61, "hold_time_seconds": 99},
    ],
    1,
    block_max_volume=42,
)
mock_thermocycler.open_lid()
mock_thermocycler.set_block_temperature(4)
mock_thermocycler.deactivate_lid()`.trimStart(),
    },
  ]

  testCases.forEach(
    ({
      testName,
      args,
      expected,
      initialThermocyclerModuleState,
      expectedPython,
    }) => {
      it(testName, () => {
        const { robotState, invariantContext } =
          getStateAndContextTempTCModules({
            temperatureModuleId,
            thermocyclerId,
          })

        if (initialThermocyclerModuleState) {
          robotState.modules[thermocyclerId].moduleState =
            initialThermocyclerModuleState
        }

        const result = thermocyclerProfileStep(
          args,
          invariantContext,
          robotState
        )
        const { commands, python } = getSuccessResult(result)
        expect(commands).toEqual(expected)
        expect(python).toEqual(expectedPython)
      })
    }
  )
})

describe('thermocyclerProfileStep() with concurrent=true', () => {
  it('should generate expected commands', () => {
    const { robotState, invariantContext } = getStateAndContextTempTCModules({
      temperatureModuleId,
      thermocyclerId,
    })

    const args: ThermocyclerProfileStepArgs = {
      commandCreatorFnName: 'thermocyclerProfile',
      concurrent: true,
      moduleId: thermocyclerId,
      profileElements: [
        {
          repetitions: 4,
          steps: [
            { celsius: 30, holdSeconds: 10 },
            { celsius: 40, holdSeconds: 20 },
          ],
        },
      ],
      profileTargetLidTemp: 55,
      profileVolume: 42,
    }

    const result = thermocyclerProfileStep(args, invariantContext, robotState)
    const { commands, python } = getSuccessResult(result)
    expect(commands).toEqual([
      {
        commandType: 'thermocycler/closeLid',
        key: expect.any(String),
        params: {
          moduleId: 'thermocyclerId',
        },
      },
      {
        commandType: 'thermocycler/setTargetLidTemperature',
        key: expect.any(String),
        params: {
          moduleId: 'thermocyclerId',
          celsius: 55,
        },
      },
      {
        commandType: 'thermocycler/startRunExtendedProfile',
        key: expect.any(String),
        params: {
          moduleId: 'thermocyclerId',
          profileElements: [
            {
              repetitions: 4,
              steps: [
                { celsius: 30, holdSeconds: 10 },
                { celsius: 40, holdSeconds: 20 },
              ],
            },
          ],
          blockMaxVolumeUl: 42,
          taskId: 'mock_thermocycler_task_1',
        },
      },
    ])
    expect(python).toStrictEqual(
      `
mock_thermocycler.close_lid()
mock_thermocycler.set_lid_temperature(55)
mock_thermocycler_task_1 = mock_thermocycler.start_execute_profile(
    [
        {"temperature": 30, "hold_time_seconds": 10},
        {"temperature": 40, "hold_time_seconds": 20},
    ],
    4,
    block_max_volume=42,
)`.trimStart()
    )
  })
})

it.each([true, false])(
  'should return timeline error with bad moduleId, concurrent=%s',
  concurrent => {
    const { robotState, invariantContext } = getStateAndContextTempTCModules({
      temperatureModuleId,
      thermocyclerId,
    })

    const args: ThermocyclerProfileStepArgs = {
      commandCreatorFnName: 'thermocyclerProfile',
      concurrent,
      blockTargetTempHold: 4,
      lidTargetTempHold: null,
      lidOpenHold: true,
      moduleId: 'badModuleId',
      profileElements: [],
      profileTargetLidTemp: 55,
      profileVolume: 42,
    }

    const result = thermocyclerProfileStep(args, invariantContext, robotState)

    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'MISSING_MODULE',
    })
  }
)
