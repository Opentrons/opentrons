import {
  HEATERSHAKER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import type { AttachedModule, FlexStackerModule } from '@opentrons/api-client'
import type {
  HeaterShakerCloseLatchCreateCommand,
  HeaterShakerDeactivateHeaterCreateCommand,
  HeaterShakerDeactivateShakerCreateCommand,
  HeaterShakerOpenLatchCreateCommand,
  TCCloseLidCreateCommand,
  TCDeactivateBlockCreateCommand,
  TCDeactivateLidCreateCommand,
  TCOpenLidCreateCommand,
  TemperatureModuleDeactivateCreateCommand,
  UnsafeFlexStackerCloseLatchCreateCommand,
  UnsafeFlexStackerPrepareShuttleCreateCommand,
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
  | UnsafeFlexStackerCloseLatchCreateCommand
  | UnsafeFlexStackerPrepareShuttleCreateCommand

//  todo(jr, 9/15/23): refactor this to be more readable
export function getModulePrepCommands(
  module: AttachedModule
): ModulePrepCommandsType[] {
  if (module.id == null) {
    console.error('No module id for module prep commands', module)
    return []
  }
  switch (module.moduleType) {
    case THERMOCYCLER_MODULE_TYPE:
      return [
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
    case HEATERSHAKER_MODULE_TYPE:
      return [
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
    case TEMPERATURE_MODULE_TYPE:
      return [
        {
          commandType: 'temperatureModule/deactivate',
          params: { moduleId: module.id },
        },
      ]
    default:
      return []
  }
}

export function getFlexStackerPrepCommands(
  module: FlexStackerModule
): ModulePrepCommandsType[] {
  return [
    {
      commandType: 'unsafe/flexStacker/closeLatch',
      params: { moduleId: module.id },
    },
    {
      commandType: 'unsafe/flexStacker/prepareShuttle',
      params: { moduleId: module.id },
    },
  ]
}
