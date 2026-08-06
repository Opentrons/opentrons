import { describe, expect, it } from 'vitest'

import {
  HEATERSHAKER_MODULE_INITIAL_STATE,
  TEMPERATURE_MODULE_INITIAL_STATE,
  THERMOCYCLER_MODULE_INITIAL_STATE,
  VACUUM_MODE_PRESSURE,
  VACUUM_MODULE_INITIAL_STATE,
} from '../../constants'
import { getModuleHasLiveTask } from '../getModuleHasLiveTask'

import type { ModuleState, ThermocyclerModuleState } from '../../types'

describe('getModuleHasLiveTask', () => {
  it.each([
    {
      description: 'true for vacuum timedHold',
      moduleState: {
        ...VACUUM_MODULE_INITIAL_STATE,
        currentPumpActivity: {
          type: 'timedHold' as const,
          mode: VACUUM_MODE_PRESSURE,
          targetPressure: 100,
          durationSeconds: 5,
          taskId: 'vac-task',
          ventAfter: true,
        },
      } satisfies ModuleState,
      expected: true,
    },
    {
      description: 'true for vacuum profile',
      moduleState: {
        ...VACUUM_MODULE_INITIAL_STATE,
        currentPumpActivity: {
          type: 'profile' as const,
          profileElements: [
            {
              enablePump: true,
              holdSeconds: 1,
              gaugePressureMbar: 50,
              ventAfter: false,
            },
          ],
          taskId: 'vac-task',
          ventAfter: false,
        },
      } satisfies ModuleState,
      expected: true,
    },
    {
      description: 'false for vacuum indefiniteHold',
      moduleState: {
        ...VACUUM_MODULE_INITIAL_STATE,
        currentPumpActivity: {
          type: 'indefiniteHold' as const,
          mode: VACUUM_MODE_PRESSURE,
          targetPressure: 200,
        },
      } satisfies ModuleState,
      expected: false,
    },
    {
      description: 'false for vacuum pumpDeactivated',
      moduleState: VACUUM_MODULE_INITIAL_STATE,
      expected: false,
    },
    {
      description: 'true for thermocycler profile',
      moduleState: {
        ...THERMOCYCLER_MODULE_INITIAL_STATE,
        currentBlockActivity: {
          type: 'profile' as const,
          profileElements: [],
          taskId: 'tc-task',
        },
      } satisfies ThermocyclerModuleState,
      expected: true,
    },
    {
      description: 'true for thermocycler blockTargetTemp',
      moduleState: {
        ...THERMOCYCLER_MODULE_INITIAL_STATE,
        currentBlockActivity: {
          type: 'blockTargetTemp' as const,
          blockTargetTemp: 72,
        },
      } satisfies ThermocyclerModuleState,
      expected: true,
    },
    {
      description: 'false for thermocycler blockDeactivated',
      moduleState: THERMOCYCLER_MODULE_INITIAL_STATE,
      expected: false,
    },
    {
      description: 'false for temperature module',
      moduleState: TEMPERATURE_MODULE_INITIAL_STATE,
      expected: false,
    },
    {
      description: 'false for heater-shaker module',
      moduleState: HEATERSHAKER_MODULE_INITIAL_STATE,
      expected: false,
    },
  ])('$description', ({ moduleState, expected }) => {
    expect(getModuleHasLiveTask(moduleState)).toBe(expected)
  })
})
