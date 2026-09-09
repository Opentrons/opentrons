import { describe, expect, it } from 'vitest'

import { VACUUM_MODULE_V1 } from '@opentrons/shared-data'

import {
  VERIFY_VACUUM_DURATION_S,
  VERIFY_VACUUM_EQUALIZE_TIMEOUT_S,
  VERIFY_VACUUM_GAUGE_PRESSURE_MBAR,
  VERIFY_VACUUM_TIMEOUT_S,
} from '../constants'
import {
  getVacuumCleanupCommands,
  getVerifyVacuumCommands,
} from '../getVerifyVacuumCommands'

const MODULE_ID = 'vacuumModuleId'
const TASK_ID = 'vacuum-setup-verify-1'
const SLOT_NAME = 'A3'

describe('getVerifyVacuumCommands', () => {
  it('builds load, close vent, pressure, and wait commands', () => {
    expect(
      getVerifyVacuumCommands({
        moduleId: MODULE_ID,
        moduleModel: VACUUM_MODULE_V1,
        slotName: SLOT_NAME,
        taskId: TASK_ID,
      })
    ).toEqual([
      {
        commandType: 'loadModule',
        params: {
          location: { slotName: SLOT_NAME },
          model: VACUUM_MODULE_V1,
          moduleId: MODULE_ID,
        },
      },
      {
        commandType: 'vacuumModule/closeVent',
        params: { moduleId: MODULE_ID },
      },
      {
        commandType: 'vacuumModule/startSetVacuumPressure',
        params: {
          moduleId: MODULE_ID,
          gaugePressure: VERIFY_VACUUM_GAUGE_PRESSURE_MBAR,
          timeout: VERIFY_VACUUM_TIMEOUT_S,
          duration: VERIFY_VACUUM_DURATION_S,
          ventAfter: true,
          equalizeTimeout: VERIFY_VACUUM_EQUALIZE_TIMEOUT_S,
          taskId: TASK_ID,
        },
      },
      {
        commandType: 'waitForTasks',
        params: { task_ids: [TASK_ID] },
      },
    ])
  })
})

describe('getVacuumCleanupCommands', () => {
  it('stops the pump and opens the vent', () => {
    expect(getVacuumCleanupCommands(MODULE_ID)).toEqual([
      {
        commandType: 'vacuumModule/stopVacuum',
        params: { moduleId: MODULE_ID },
      },
      {
        commandType: 'vacuumModule/openVent',
        params: { moduleId: MODULE_ID },
      },
    ])
  })
})
