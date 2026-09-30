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
})
