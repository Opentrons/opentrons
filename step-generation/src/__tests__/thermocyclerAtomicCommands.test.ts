import { thermocyclerSetTargetBlockTemperature } from '../commandCreators/atomic/thermocyclerSetTargetBlockTemperature'
import { thermocyclerSetTargetLidTemperature } from '../commandCreators/atomic/thermocyclerSetTargetLidTemperature'
import { thermocyclerWaitForBlockTemperature } from '../commandCreators/atomic/thermocyclerWaitForBlockTemperature'
import { thermocyclerWaitForLidTemperature } from '../commandCreators/atomic/thermocyclerWaitForLidTemperature'
import { thermocyclerDeactivateBlock } from '../commandCreators/atomic/thermocyclerDeactivateBlock'
import { thermocyclerDeactivateLid } from '../commandCreators/atomic/thermocyclerDeactivateLid'
import { thermocyclerRunProfile } from '../commandCreators/atomic/thermocyclerRunProfile'
import { thermocyclerCloseLid } from '../commandCreators/atomic/thermocyclerCloseLid'
import { thermocyclerOpenLid } from '../commandCreators/atomic/thermocyclerOpenLid'
import { getSuccessResult } from '../fixtures'
import type {
  AtomicProfileStep,
  ModuleOnlyParams,
  TemperatureParams,
  TCProfileParams,
} from '@opentrons/shared-data/protocol/types/schemaV4'
import type { CommandCreator } from '../types'

const getRobotInitialState = (): any => {
  // This particular state shouldn't matter for these command creators
  return {}
}

// neither should InvariantContext
const invariantContext: any = {}
const module: ModuleOnlyParams['module'] = 'someTCModuleId'
const temperature: TemperatureParams['temperature'] = 42
const holdTime: AtomicProfileStep['holdTime'] = 10
const volume: TCProfileParams['volume'] = 10
const profile = [
  {
    temperature,
    holdTime,
  },
]
describe('thermocycler atomic commands', () => {
  // NOTE(IL, 2020-05-11): splitting these into different arrays based on type of args
  // the command creator takes, so tests are type-safe
  const testCasesSetBlock = [
    {
      commandCreator: thermocyclerSetTargetBlockTemperature,
      expectedType: 'thermocycler/setTargetBlockTemperature',
      params: {
        module,
        temperature,
      },
    },
  ]
  const testCasesWithTempParam = [
    {
      commandCreator: thermocyclerSetTargetLidTemperature,
      expectedType: 'thermocycler/setTargetLidTemperature',
      params: {
        module,
        temperature,
      },
    },
    {
      commandCreator: thermocyclerWaitForBlockTemperature,
      expectedType: 'thermocycler/waitForBlockTemperature',
      params: {
        module,
      },
    },
    {
      commandCreator: thermocyclerWaitForLidTemperature,
      expectedType: 'thermocycler/waitForLidTemperature',
      params: {
        module,
      },
    },
  ]
  const testCasesModuleOnly = [
    {
      commandCreator: thermocyclerDeactivateBlock,
      expectedType: 'thermocycler/deactivateBlock',
      params: {
        module,
      },
    },
    {
      commandCreator: thermocyclerDeactivateLid,
      expectedType: 'thermocycler/deactivateLid',
      params: {
        module,
      },
    },
    {
      commandCreator: thermocyclerCloseLid,
      expectedType: 'thermocycler/closeLid',
      params: {
        module,
      },
    },
    {
      commandCreator: thermocyclerOpenLid,
      expectedType: 'thermocycler/openLid',
      params: {
        module,
      },
    },
  ]
  const testCasesRunProfile = [
    {
      commandCreator: thermocyclerRunProfile,
      expectedType: 'thermocycler/runProfile',
      params: {
        module,
        profile,
        volume,
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
      const robotInitialState = getRobotInitialState()
      const result = commandCreator(params, invariantContext, robotInitialState)
      const res = getSuccessResult(result)
      const v6Params = {
        ...params,
        moduleId: params.module,
        celsius: params.temperature,
      }
      delete v6Params.module
      delete v6Params.temperature
      if (v6Params.profile != null) {
        v6Params.profile = v6Params.profile.map(
          (profileItem: { temperature: number; holdTime: number }) => ({
            celsius: profileItem.temperature,
            holdSeconds: profileItem.holdTime,
          })
        )
      }
      if (v6Params.volume != null) {
        v6Params.blockMaxVolumeUl = v6Params.volume
        delete v6Params.volume
      }
      expect(res.commands).toEqual([
        {
          commandType: expectedType,
          key: expect.any(String),
          params: v6Params,
        },
      ])
    })
  }

  // run all the test testCases
  testCasesSetBlock.forEach(testParams)
  testCasesWithTempParam.forEach(testParams)
  testCasesModuleOnly.forEach(testParams)
  testCasesRunProfile.forEach(testParams)
})
