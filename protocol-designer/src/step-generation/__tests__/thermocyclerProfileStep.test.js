// @flow
import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'
import { thermocyclerProfileStep } from '../commandCreators/compound/thermocyclerProfileStep'
import {
  getStateAndContextTempTCModules,
  getSuccessResult,
} from '../__fixtures__'
import type { Command } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type { ThermocyclerModuleState } from '../../step-forms/types'
import type { ThermocyclerProfileStepArgs } from '../types'

const temperatureModuleId = 'temperatureModuleId'
const thermocyclerId = 'thermocyclerId'

describe('thermocyclerProfileStep', () => {
  // TODO: case with bad module ID should error

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
          command: 'thermocycler/setTargetLidTemperature',
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
          command: 'thermocycler/deactivateLid',
          params: {
            module: 'thermocyclerId',
          },
        },
      ],
    },
    {
      testName:
        'should generate expected commands, omitting the setTargetLidTemperature when lid temp is already at desired temp',
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
        profileSteps: [],
        profileTargetLidTemp: 55,
        profileVolume: 42,
      },
      expected: [
        {
          command: 'thermocycler/runProfile',
          params: {
            module: 'thermocyclerId',
            profile: [],
            volume: 42,
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
})
