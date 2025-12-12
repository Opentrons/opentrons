import { describe, expect, it } from 'vitest'

import { thermocyclerCloseLid } from '../thermocyclerCloseLid'
import { thermocyclerDeactivateBlock } from '../thermocyclerDeactivateBlock'
import { thermocyclerDeactivateLid } from '../thermocyclerDeactivateLid'
import { thermocyclerOpenLid } from '../thermocyclerOpenLid'
import { thermocyclerRunExtendedProfile } from '../thermocyclerRunExtendedProfile'
import { thermocyclerSetTargetBlockTemperature } from '../thermocyclerSetTargetBlockTemperature'
import { thermocyclerSetTargetLidTemperature } from '../thermocyclerSetTargetLidTemperature'
import { getSuccessResult } from '../../../fixtures'

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
}
describe('thermocycler atomic commands', () => {
  const testCasesSetBlock = [
    {
      commandCreator: thermocyclerSetTargetBlockTemperature,
      expectedType: 'thermocycler/setTargetBlockTemperature',
      params: {
        moduleId: module,
        celsius: temperature,
      },
    },
  ]
  const testCasesWithTempParam = [
    {
      commandCreator: thermocyclerSetTargetLidTemperature,
      expectedType: 'thermocycler/setTargetLidTemperature',
      params: {
        moduleId: module,
        celsius: temperature,
      },
    },
  ]
  const testCasesModuleOnly = [
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
  ]
  const testCasesRunExtendedProfile = [
    {
      commandCreator: thermocyclerRunExtendedProfile,
      expectedType: 'thermocycler/runExtendedProfile',
      params: {
        moduleId: module,
        profileElements,
        blockMaxVolumeUl: volume,
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

  // Run all test cases
  testCasesSetBlock.forEach(testParams)
  testCasesWithTempParam.forEach(testParams)
  testCasesModuleOnly.forEach(testParams)
  testCasesRunExtendedProfile.forEach(testParams)
})
