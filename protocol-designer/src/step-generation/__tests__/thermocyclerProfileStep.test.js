// @flow
import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'
import { thermocyclerProfileStep } from '../commandCreators/compound/thermocyclerProfileStep'
import {
  getErrorResult,
  getStateAndContextTempTCModules,
  getSuccessResult,
} from '../__fixtures__'
import type { Command } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type { ThermocyclerModuleState } from '../../step-forms/types'
import type { ThermocyclerProfileStepArgs } from '../types'

const temperatureModuleId = 'temperatureModuleId'
const thermocyclerId = 'thermocyclerId'

describe('thermocyclerProfileStep', () => {
  const testCases: Array<{|
    testName: string,
    initialThermocyclerModuleState?: ThermocyclerModuleState,
    args: ThermocyclerProfileStepArgs,
    expected: Array<Command>,
  |}> = [
    {
      testName: 'should generate expected commands',
      args: {
        commandCreatorFnName: 'thermocyclerProfile',
        blockTargetTempHold: 4,
        lidTargetTempHold: null,
        lidOpenHold: true,
        module: thermocyclerId,
        profileSteps: [],
        profileTargetLidTemp: 55,
        profileVolume: 42,
      },
      expected: [
        {
          command: 'thermocycler/closeLid',
          params: {
            module: 'thermocyclerId',
          },
        },
        {
          command: 'thermocycler/setTargetLidTemperature',
          params: {
            module: 'thermocyclerId',
            temperature: 55,
          },
        },
        {
          command: 'thermocycler/awaitLidTemperature',
          params: {
            module: 'thermocyclerId',
            temperature: 55,
          },
        },
        {
          command: 'thermocycler/runProfile',
          params: {
            module: 'thermocyclerId',
            profile: [],
            volume: 42,
          },
        },
        {
          command: 'thermocycler/awaitProfileComplete',
          params: {
            module: 'thermocyclerId',
          },
        },
        {
          command: 'thermocycler/openLid',
          params: {
            module: 'thermocyclerId',
          },
        },
        {
          command: 'thermocycler/setTargetBlockTemperature',
          params: {
            module: 'thermocyclerId',
            temperature: 4,
          },
        },
        {
          command: 'thermocycler/awaitBlockTemperature',
          params: {
            module: 'thermocyclerId',
            temperature: 4,
          },
        },
        {
          command: 'thermocycler/deactivateLid',
          params: {
            module: 'thermocyclerId',
          },
        },
      ],
    },
    {
      testName:
        'should omit the setTargetLidTemperature when lid temp is already at desired temp',
      initialThermocyclerModuleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: null,
        lidTargetTemp: 55,
        lidOpen: false,
      },
      args: {
        commandCreatorFnName: 'thermocyclerProfile',
        blockTargetTempHold: 4,
        lidTargetTempHold: null,
        lidOpenHold: true,
        module: thermocyclerId,
        profileSteps: [{ temperature: 61, holdTime: 99 }],
        profileTargetLidTemp: 55,
        profileVolume: 42,
      },
      expected: [
        {
          command: 'thermocycler/runProfile',
          params: {
            module: 'thermocyclerId',
            profile: [{ temperature: 61, holdTime: 99 }],
            volume: 42,
          },
        },
        {
          command: 'thermocycler/awaitProfileComplete',
          params: {
            module: 'thermocyclerId',
          },
        },
        {
          command: 'thermocycler/openLid',
          params: {
            module: 'thermocyclerId',
          },
        },
        {
          command: 'thermocycler/setTargetBlockTemperature',
          params: {
            module: 'thermocyclerId',
            temperature: 4,
          },
        },
        {
          command: 'thermocycler/awaitBlockTemperature',
          params: {
            module: 'thermocyclerId',
            temperature: 4,
          },
        },
        {
          command: 'thermocycler/deactivateLid',
          params: {
            module: 'thermocyclerId',
          },
        },
      ],
    },
    {
      testName:
        'should close the lid before running the profile if the lid open state is null',
      initialThermocyclerModuleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: null,
        lidTargetTemp: 55,
        lidOpen: null,
      },
      args: {
        commandCreatorFnName: 'thermocyclerProfile',
        blockTargetTempHold: 4,
        lidTargetTempHold: null,
        lidOpenHold: true,
        module: thermocyclerId,
        profileSteps: [{ temperature: 61, holdTime: 99 }],
        profileTargetLidTemp: 55,
        profileVolume: 42,
      },
      expected: [
        {
          command: 'thermocycler/closeLid',
          params: {
            module: 'thermocyclerId',
          },
        },
        {
          command: 'thermocycler/runProfile',
          params: {
            module: 'thermocyclerId',
            profile: [{ temperature: 61, holdTime: 99 }],
            volume: 42,
          },
        },
        {
          command: 'thermocycler/awaitProfileComplete',
          params: {
            module: 'thermocyclerId',
          },
        },
        {
          command: 'thermocycler/openLid',
          params: {
            module: 'thermocyclerId',
          },
        },
        {
          command: 'thermocycler/setTargetBlockTemperature',
          params: {
            module: 'thermocyclerId',
            temperature: 4,
          },
        },
        {
          command: 'thermocycler/awaitBlockTemperature',
          params: {
            module: 'thermocyclerId',
            temperature: 4,
          },
        },
        {
          command: 'thermocycler/deactivateLid',
          params: {
            module: 'thermocyclerId',
          },
        },
      ],
    },
    {
      testName:
        'should omit the closeLid when the lid open state is false before running a profile',
      initialThermocyclerModuleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: null,
        lidTargetTemp: 55,
        lidOpen: false,
      },
      args: {
        commandCreatorFnName: 'thermocyclerProfile',
        blockTargetTempHold: 4,
        lidTargetTempHold: null,
        lidOpenHold: true,
        module: thermocyclerId,
        profileSteps: [{ temperature: 61, holdTime: 99 }],
        profileTargetLidTemp: 55,
        profileVolume: 42,
      },
      expected: [
        {
          command: 'thermocycler/runProfile',
          params: {
            module: 'thermocyclerId',
            profile: [{ temperature: 61, holdTime: 99 }],
            volume: 42,
          },
        },
        {
          command: 'thermocycler/awaitProfileComplete',
          params: {
            module: 'thermocyclerId',
          },
        },
        {
          command: 'thermocycler/openLid',
          params: {
            module: 'thermocyclerId',
          },
        },
        {
          command: 'thermocycler/setTargetBlockTemperature',
          params: {
            module: 'thermocyclerId',
            temperature: 4,
          },
        },
        {
          command: 'thermocycler/awaitBlockTemperature',
          params: {
            module: 'thermocyclerId',
            temperature: 4,
          },
        },
        {
          command: 'thermocycler/deactivateLid',
          params: {
            module: 'thermocyclerId',
          },
        },
      ],
    },
  ]

  testCases.forEach(
    ({ testName, args, expected, initialThermocyclerModuleState }) => {
      it(testName, () => {
        const {
          robotState,
          invariantContext,
        } = getStateAndContextTempTCModules({
          temperatureModuleId,
          thermocyclerId,
        })

        if (initialThermocyclerModuleState) {
          robotState.modules[
            thermocyclerId
          ].moduleState = initialThermocyclerModuleState
        }

        const result = thermocyclerProfileStep(
          args,
          invariantContext,
          robotState
        )
        const { commands } = getSuccessResult(result)
        expect(commands).toEqual(expected)
      })
    }
  )

  it('should return timeline error with bad moduleId', () => {
    const { robotState, invariantContext } = getStateAndContextTempTCModules({
      temperatureModuleId,
      thermocyclerId,
    })

    const args = {
      commandCreatorFnName: 'thermocyclerProfile',
      blockTargetTempHold: 4,
      lidTargetTempHold: null,
      lidOpenHold: true,
      module: 'badModuleId',
      profileSteps: [],
      profileTargetLidTemp: 55,
      profileVolume: 42,
    }

    const result = thermocyclerProfileStep(args, invariantContext, robotState)

    expect(getErrorResult(result).errors).toHaveLength(1)
    expect(getErrorResult(result).errors[0]).toMatchObject({
      type: 'MISSING_MODULE',
    })
  })
})
