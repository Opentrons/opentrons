// @flow
import { thermocyclerStateDiff } from '../utils/thermocyclerStateDiff'
import { thermocyclerStateStep } from '../commandCreators/compound/thermocyclerStateStep'
import {
  getStateAndContextTempTCModules,
  getSuccessResult,
} from '../__fixtures__'
import type { Diff } from '../utils/thermocyclerStateDiff'
import type { ThermocyclerStateStepArgs } from '../types'
import type { ThermocyclerModuleState } from '../../step-forms/types'

jest.mock('../utils/thermocyclerStateDiff')

const mockThermocyclerStateDiff: JestMockFn<
  [ThermocyclerModuleState, ThermocyclerStateStepArgs],
  Diff
> = thermocyclerStateDiff

const getInitialDiff = () => ({
  lidOpen: false,
  lidClosed: false,
  setBlockTemperature: false,
  deactivateBlockTemperature: false,
  setLidTemperature: false,
  deactivateLidTemperature: false,
})

const temperatureModuleId = 'temperatureModuleId'
const thermocyclerId = 'thermocyclerId'

describe('thermocyclerStateStep', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  const testCases = [
    {
      testMsg: 'should open the lid when diff includes lidOpen',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: true,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: {
        ...getInitialDiff(),
        lidOpen: true,
      },
      expected: [
        {
          command: 'thermocycler/openLid',
          params: {
            module: thermocyclerId,
          },
        },
      ],
    },
    {
      testMsg: 'should close the lid when diff includes lidClosed',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: false,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: {
        ...getInitialDiff(),
        lidClosed: true,
      },
      expected: [
        {
          command: 'thermocycler/closeLid',
          params: {
            module: thermocyclerId,
          },
        },
      ],
    },
    {
      testMsg:
        'should set the block temperature when diff includes setBlockTemperature',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: 10,
        lidTargetTemp: null,
        lidOpen: false,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: {
        ...getInitialDiff(),
        setBlockTemperature: true,
      },
      expected: [
        {
          command: 'thermocycler/setTargetBlockTemperature',
          params: {
            module: thermocyclerId,
            temperature: 10,
          },
        },
      ],
    },
    {
      testMsg:
        'should decativate the block when diff includes deactivateBlockTemperature',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: false,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: {
        ...getInitialDiff(),
        deactivateBlockTemperature: true,
      },
      expected: [
        {
          command: 'thermocycler/deactivateBlock',
          params: {
            module: thermocyclerId,
          },
        },
      ],
    },
    {
      testMsg:
        'should set the lid temperature when diff includes setLidTemperature',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: 10,
        lidOpen: false,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: {
        ...getInitialDiff(),
        setLidTemperature: true,
      },
      expected: [
        {
          command: 'thermocycler/setTargetLidTemperature',
          params: {
            module: thermocyclerId,
            temperature: 10,
          },
        },
      ],
    },
    {
      testMsg:
        'should decativate the block when diff includes deactivateBlockTemperature',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: false,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: {
        ...getInitialDiff(),
        deactivateBlockTemperature: true,
      },
      expected: [
        {
          command: 'thermocycler/deactivateBlock',
          params: {
            module: thermocyclerId,
          },
        },
      ],
    },
    {
      testMsg:
        'should set the lid temperature when diff includes setLidTemperature',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: 10,
        lidOpen: false,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: {
        ...getInitialDiff(),
        setLidTemperature: true,
      },
      expected: [
        {
          command: 'thermocycler/setTargetLidTemperature',
          params: {
            module: thermocyclerId,
            temperature: 10,
          },
        },
      ],
    },
    {
      testMsg:
        'should deactivate the lid when diff includes deactivateLidTemperature',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: false,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: {
        ...getInitialDiff(),
        deactivateLidTemperature: true,
      },
      expected: [
        {
          command: 'thermocycler/deactivateLid',
          params: {
            module: thermocyclerId,
          },
        },
      ],
    },
    {
      testMsg: 'should issue commands in the correct order',
      thermocyclerStateArgs: {
        module: thermocyclerId,
        commandCreatorFnName: 'thermocyclerState',
        blockTargetTemp: 10,
        lidTargetTemp: 20,
        lidOpen: false,
      },
      ...getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      }),
      thermocyclerStateDiff: {
        lidOpen: true,
        lidClosed: true,
        setBlockTemperature: true,
        deactivateBlockTemperature: true,
        setLidTemperature: true,
        deactivateLidTemperature: true,
      },
      expected: [
        {
          command: 'thermocycler/openLid',
          params: {
            module: thermocyclerId,
          },
        },
        {
          command: 'thermocycler/closeLid',
          params: {
            module: thermocyclerId,
          },
        },
        {
          command: 'thermocycler/deactivateBlock',
          params: {
            module: thermocyclerId,
          },
        },
        {
          command: 'thermocycler/setTargetBlockTemperature',
          params: {
            module: thermocyclerId,
            temperature: 10,
          },
        },
        {
          command: 'thermocycler/deactivateLid',
          params: {
            module: thermocyclerId,
          },
        },
        {
          command: 'thermocycler/setTargetLidTemperature',
          params: {
            module: thermocyclerId,
            temperature: 20,
          },
        },
      ],
    },
  ]

  testCases.forEach(
    ({
      testMsg,
      thermocyclerStateArgs,
      robotState,
      invariantContext,
      thermocyclerStateDiff,
      expected,
    }) => {
      it(testMsg, () => {
        mockThermocyclerStateDiff.mockImplementationOnce((state, args) => {
          expect(state).toEqual(robotState.modules[thermocyclerId].moduleState)
          expect(args).toEqual(thermocyclerStateArgs)
          return thermocyclerStateDiff
        })

        const result = thermocyclerStateStep(
          thermocyclerStateArgs,
          invariantContext,
          robotState
        )
        const { commands } = getSuccessResult(result)
        expect(commands).toEqual(expected)
      })
    }
  )
})
