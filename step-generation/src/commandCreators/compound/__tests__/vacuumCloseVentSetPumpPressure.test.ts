import cloneDeep from 'lodash/cloneDeep'
import merge from 'lodash/merge'
import { beforeEach, describe, expect, it } from 'vitest'

import { VACUUM_MODULE_TYPE, VACUUM_MODULE_V1 } from '@opentrons/shared-data'

import { VACUUM_MODULE_INITIAL_STATE } from '../../../constants'
import {
  getInitialRobotStateStandard,
  getSuccessResult,
  makeContext,
} from '../../../fixtures'
import { vacuumCloseVentSetPumpPressure } from '../vacuumCloseVentSetPumpPressure'

import type { InvariantContext, RobotState } from '../../../types'

const vacuumModuleId = 'vacuumModuleId'

describe('vacuumCloseVentSetPumpPressure', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState
  beforeEach(() => {
    invariantContext = {
      ...makeContext(),
      moduleEntities: {
        [vacuumModuleId]: {
          id: vacuumModuleId,
          type: VACUUM_MODULE_TYPE,
          model: VACUUM_MODULE_V1,
          pythonName: 'mock_vacuum_module',
        },
      },
    }
    const base = getInitialRobotStateStandard(invariantContext)
    robotState = merge({}, cloneDeep(base), {
      modules: {
        [vacuumModuleId]: {
          slot: 'A3',
          moduleState: { ...VACUUM_MODULE_INITIAL_STATE },
        },
      },
    })
  })
  it('resolves runtime parameters into the command and python', () => {
    invariantContext.runtimeParameters = {
      selected_module: {
        variableName: 'selected_module',
        displayName: 'Selected module',
        type: 'string',
        default: vacuumModuleId,
      },
      gauge_pressure: {
        variableName: 'gauge_pressure',
        displayName: 'Gauge pressure',
        type: 'int',
        default: 150,
      },
    }
    const result = vacuumCloseVentSetPumpPressure(
      {
        commandCreatorFnName: 'vacuumCloseVentSetPumpPressure',
        moduleId: 'selected_module',
        gaugePressure: 'gauge_pressure',
      },
      invariantContext,
      robotState
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'vacuumModule/closeVent',
          key: expect.any(String),
          params: { moduleId: vacuumModuleId },
        },
        {
          commandType: 'vacuumModule/startSetVacuumPressure',
          key: expect.any(String),
          params: {
            moduleId: vacuumModuleId,
            gaugePressure: 150,
          },
        },
      ],
      python: `mock_vacuum_module.close_vent()
mock_vacuum_module.start_set_vacuum_pressure(
    gauge_pressure_mbar=gauge_pressure
)`,
      warnings: [],
    })
  })
})
