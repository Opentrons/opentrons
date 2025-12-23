import { describe, expect, it } from 'vitest'

import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'

import {
  getErrorResult,
  getStateAndContextTempTCModules,
  getSuccessResult,
} from '../../../fixtures'
import { waitForModuleTask } from '../waitForModuleTask'

import type {
  ThermocyclerModuleState,
  WaitForModuleTaskArgs,
} from '../../../types'

const temperatureModuleId = 'temperatureModuleId'
const thermocyclerId = 'thermocyclerId'

describe('waitForModuleTask', () => {
  describe('waitCondition: thermocyclerProfileComplete', () => {
    it("should generate a waitForTasks command for the Thermocycler's ongoing profile", () => {
      const { robotState, invariantContext } = getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      })

      const thermocyclerModuleState: ThermocyclerModuleState = {
        type: THERMOCYCLER_MODULE_TYPE,
        currentBlockActivity: {
          type: 'profile',
          profileElements: [
            {
              repetitions: 2,
              steps: [
                { celsius: 30, holdSeconds: 10 },
                { celsius: 40, holdSeconds: 20 },
              ],
            },
          ],
          taskId: 'test_task_id',
        },
        lidTargetTemp: null,
        lidOpen: null,
        numProfilesStarted: 1,
      }
      robotState.modules[thermocyclerId].moduleState = thermocyclerModuleState

      const args: WaitForModuleTaskArgs = {
        commandCreatorFnName: 'waitForModuleTask',
        waitCondition: 'thermocyclerProfileComplete',
        moduleId: thermocyclerId,
      }

      const result = waitForModuleTask(args, invariantContext, robotState)
      const { commands, python } = getSuccessResult(result)

      expect(commands).toEqual([
        {
          commandType: 'waitForTasks',
          key: expect.any(String),
          params: {
            task_ids: ['test_task_id'],
          },
        },
      ])
      expect(python).toStrictEqual(`protocol.wait_for_tasks([test_task_id])`)
    })

    it("should return an error if it can't find the given module", () => {
      const { robotState, invariantContext } = getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      })

      const args: WaitForModuleTaskArgs = {
        commandCreatorFnName: 'waitForModuleTask',
        waitCondition: 'thermocyclerProfileComplete',
        moduleId: 'nonexistent-module-id',
      }

      const result = waitForModuleTask(args, invariantContext, robotState)
      const errorResult = getErrorResult(result)

      expect(errorResult.errors).toStrictEqual([
        { type: 'MISSING_MODULE', message: expect.any(String) },
      ] satisfies typeof errorResult.errors)
    })

    it("should return an error if the given Thermocycler isn't running a profile", () => {
      const { robotState, invariantContext } = getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      })

      const thermocyclerModuleState: ThermocyclerModuleState = {
        type: THERMOCYCLER_MODULE_TYPE,
        currentBlockActivity: { type: 'blockTargetTemp', blockTargetTemp: 50 }, // Not a profile.
        lidTargetTemp: null,
        lidOpen: null,
        numProfilesStarted: 0,
      }
      robotState.modules[thermocyclerId].moduleState = thermocyclerModuleState

      const args: WaitForModuleTaskArgs = {
        commandCreatorFnName: 'waitForModuleTask',
        waitCondition: 'thermocyclerProfileComplete',
        moduleId: thermocyclerId,
      }

      const result = waitForModuleTask(args, invariantContext, robotState)
      const errorResult = getErrorResult(result)

      expect(errorResult.errors).toStrictEqual([
        { type: 'MISSING_PROFILE_STEP', message: expect.any(String) },
      ] satisfies typeof errorResult.errors)
    })

    it('should return error when thermocycler profile has null taskId', () => {
      const { robotState, invariantContext } = getStateAndContextTempTCModules({
        temperatureModuleId,
        thermocyclerId,
      })

      // Set up thermocycler with a profile activity but null taskId
      const thermocyclerModuleState: ThermocyclerModuleState = {
        type: THERMOCYCLER_MODULE_TYPE,
        currentBlockActivity: {
          type: 'profile',
          profileElements: [
            {
              repetitions: 1,
              steps: [{ celsius: 50, holdSeconds: 5 }],
            },
          ],
          taskId: null,
        },
        lidTargetTemp: null,
        lidOpen: null,
        numProfilesStarted: 1,
      }
      robotState.modules[thermocyclerId].moduleState = thermocyclerModuleState

      const args: WaitForModuleTaskArgs = {
        commandCreatorFnName: 'waitForModuleTask',
        waitCondition: 'thermocyclerProfileComplete',
        moduleId: thermocyclerId,
      }

      const result = waitForModuleTask(args, invariantContext, robotState)
      const errorResult = getErrorResult(result)

      expect(errorResult.errors).toStrictEqual([
        { type: 'MISSING_PROFILE_STEP', message: expect.any(String) },
      ] satisfies typeof errorResult.errors)
    })
  })
})
