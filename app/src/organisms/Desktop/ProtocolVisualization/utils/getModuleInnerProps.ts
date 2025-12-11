import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'

import type { ComponentProps } from 'react'
import type { Module } from '@opentrons/components'
import type { ModuleTemporalProperties } from '@opentrons/step-generation'

export const getModuleInnerProps = (
  moduleState: ModuleTemporalProperties['moduleState']
): ComponentProps<typeof Module>['innerProps'] => {
  if (moduleState.type === THERMOCYCLER_MODULE_TYPE) {
    let lidMotorState = 'unknown'
    if (moduleState.lidOpen) {
      lidMotorState = 'open'
    } else if (moduleState.lidOpen === false) {
      lidMotorState = 'closed'
    }
    return {
      lidMotorState,
      blockTargetTemp:
        moduleState.currentBlockActivity.type === 'blockTargetTemp'
          ? moduleState.currentBlockActivity.blockTargetTemp
          : null,
    }
  } else if (
    'targetTemperature' in moduleState &&
    moduleState.type === 'temperatureModuleType'
  ) {
    return {
      targetTemperature: moduleState.targetTemperature,
    }
  } else if ('targetTemp' in moduleState) {
    return {
      targetTemp: moduleState.targetTemp,
    }
  }
}
