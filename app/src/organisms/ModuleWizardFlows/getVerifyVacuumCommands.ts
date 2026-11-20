import {
  VERIFY_VACUUM_DURATION_S,
  VERIFY_VACUUM_EQUALIZE_TIMEOUT_S,
  VERIFY_VACUUM_GAUGE_PRESSURE_MBAR,
  VERIFY_VACUUM_TIMEOUT_S,
} from './constants'

import type { CreateCommand, ModuleModel } from '@opentrons/shared-data'

export interface GetVerifyVacuumCommandsParams {
  moduleId: string
  moduleModel: ModuleModel
  slotName: string
  taskId: string
}

export function getVerifyVacuumCommands(
  params: GetVerifyVacuumCommandsParams
): CreateCommand[] {
  const { moduleId, moduleModel, slotName, taskId } = params

  return [
    {
      commandType: 'loadModule',
      params: {
        location: { slotName },
        model: moduleModel,
        moduleId,
      },
    },
    {
      commandType: 'vacuumModule/closeVent',
      params: { moduleId },
    },
    {
      commandType: 'vacuumModule/startSetVacuumPressure',
      params: {
        moduleId,
        gaugePressure: VERIFY_VACUUM_GAUGE_PRESSURE_MBAR,
        timeout: VERIFY_VACUUM_TIMEOUT_S,
        duration: VERIFY_VACUUM_DURATION_S,
        ventAfter: true,
        equalizeTimeout: VERIFY_VACUUM_EQUALIZE_TIMEOUT_S,
        taskId,
      },
    },
    {
      commandType: 'waitForTasks',
      params: { task_ids: [taskId] },
    },
  ]
}

export function getVacuumCleanupCommands(moduleId: string): CreateCommand[] {
  return [
    {
      commandType: 'vacuumModule/stopVacuum',
      params: { moduleId },
    },
    {
      commandType: 'vacuumModule/openVent',
      params: { moduleId },
    },
  ]
}
