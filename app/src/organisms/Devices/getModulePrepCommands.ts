import {
  THERMOCYCLER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
} from '@opentrons/shared-data'
import { AttachedModule } from '../../redux/modules/types'
import type {
  HeaterShakerDeactivateHeaterCreateCommand,
  HeaterShakerDeactivateShakerCreateCommand,
  HeaterShakerOpenLatchCreateCommand,
  TCDeactivateBlockCreateCommand,
  TCDeactivateLidCreateCommand,
  TemperatureModuleDeactivateCreateCommand,
  TCOpenLidCreateCommand,
  HeaterShakerCloseLatchCreateCommand,
  TCCloseLidCreateCommand,
} from '@opentrons/shared-data'

export type ModulePrepCommandsType =
  | TemperatureModuleDeactivateCreateCommand
  | HeaterShakerDeactivateHeaterCreateCommand
  | TCDeactivateLidCreateCommand
  | TCDeactivateBlockCreateCommand
  | HeaterShakerDeactivateShakerCreateCommand
  | HeaterShakerOpenLatchCreateCommand
  | HeaterShakerCloseLatchCreateCommand
  | TCOpenLidCreateCommand
  | TCCloseLidCreateCommand

//  todo(jr, 9/15/23): refactor this to be more readable
export function getModulePrepCommands(
  module: AttachedModule
): ModulePrepCommandsType[] {
  let modulePrepCommands: ModulePrepCommandsType[] = []
  if (module.id != null && module.moduleType === THERMOCYCLER_MODULE_TYPE) {
    modulePrepCommands = [
      {
        commandType: 'thermocycler/deactivateLid',
        params: { moduleId: module.id },
      },
      {
        commandType: 'thermocycler/deactivateBlock',
        params: { moduleId: module.id },
      },
      {
        commandType: 'thermocycler/openLid',
        params: { moduleId: module.id },
      },
    ]
  } else if (
    module.id != null &&
    module.moduleType === HEATERSHAKER_MODULE_TYPE
  ) {
    modulePrepCommands = [
      {
        commandType: 'heaterShaker/closeLabwareLatch',
        params: { moduleId: module.id },
      },
      {
        commandType: 'heaterShaker/deactivateHeater',
        params: { moduleId: module.id },
      },
      {
        commandType: 'heaterShaker/deactivateShaker',
        params: { moduleId: module.id },
      },
      {
        commandType: 'heaterShaker/openLabwareLatch',
        params: { moduleId: module.id },
      },
    ]
  } else if (
    module.id != null &&
    module.moduleType === TEMPERATURE_MODULE_TYPE
  ) {
    modulePrepCommands = [
      {
        commandType: 'temperatureModule/deactivate',
        params: { moduleId: module.id },
      },
    ]
  }

  return modulePrepCommands
}
