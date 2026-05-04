import {
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import type {
  ModuleState,
  ThermocyclerModuleState,
  VacuumModuleState,
} from '../types'

export const getModuleHasLiveTask = (moduleState: ModuleState): boolean => {
  if (moduleState.type === VACUUM_MODULE_TYPE) {
    const vacuumModuleState = moduleState as VacuumModuleState
    return (
      vacuumModuleState.currentPumpActivity.type === 'timedHold' ||
      vacuumModuleState.currentPumpActivity.type === 'profile'
    )
  }
  if (moduleState.type === THERMOCYCLER_MODULE_TYPE) {
    const thermocyclerModuleState = moduleState as ThermocyclerModuleState
    return (
      thermocyclerModuleState.currentBlockActivity.type === 'profile' ||
      thermocyclerModuleState.currentBlockActivity.type === 'blockTargetTemp'
    )
  }
  return false
}
