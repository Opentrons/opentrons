import type { RunTimeCommand } from '@opentrons/shared-data'
import type { HandlesCommands } from '../types'

type HandledCommands = Extract<
  RunTimeCommand,
  {
    commandType:
      | 'vacuumModule/startSetVacuumPressure'
      | 'vacuumModule/startSetVacuumPower'
      | 'vacuumModule/stopVacuum'
      | 'vacuumModule/openVent'
      | 'vacuumModule/closeVent'
  }
>

export type GetVacuumModuleCommandText = HandlesCommands<HandledCommands>

export function getVacuumModuleCommandText({
  command,
  t,
}: GetVacuumModuleCommandText): string {
  switch (command.commandType) {
    case 'vacuumModule/startSetVacuumPressure': {
      const { gaugePressure, duration } = command.params
      return duration != null
        ? t('setting_vacuum_module_pressure_with_hold', {
            pressure: gaugePressure,
            hold_time_seconds: duration,
          })
        : t('setting_vacuum_module_pressure', { pressure: gaugePressure })
    }
    case 'vacuumModule/startSetVacuumPower': {
      const { percentPower, duration } = command.params
      return duration != null
        ? t('setting_vacuum_module_power_with_hold', {
            power: percentPower,
            hold_time_seconds: duration,
          })
        : t('setting_vacuum_module_power', { power: percentPower })
    }
    case 'vacuumModule/stopVacuum':
      return t('stopping_vacuum_module')
    case 'vacuumModule/openVent':
      return t('opening_vacuum_module_vent')
    case 'vacuumModule/closeVent':
      return t('closing_vacuum_module_vent')
  }
}
