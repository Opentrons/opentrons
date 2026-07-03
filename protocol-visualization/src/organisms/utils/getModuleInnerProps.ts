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

    let blockTargetTemp
    switch (moduleState.currentBlockActivity.type) {
      case 'blockTargetTemp':
        blockTargetTemp = moduleState.currentBlockActivity.blockTargetTemp
        break
      case 'blockDeactivated':
        blockTargetTemp = null
        break
      case 'profile':
        blockTargetTemp = null
        break
      default:
        moduleState.currentBlockActivity satisfies never
    }

    return {
      lidMotorState,
      blockTargetTemp,
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
