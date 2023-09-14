import { CommandData } from '@opentrons/api-client'
import { UseMutateAsyncFunction } from 'react-query'
import {
  HEATERSHAKER_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
} from '@opentrons/shared-data'

import type {
  HeaterShakerDeactivateHeaterCreateCommand,
  HeaterShakerDeactivateShakerCreateCommand,
  HeaterShakerOpenLatchCreateCommand,
  TCDeactivateBlockCreateCommand,
  TCDeactivateLidCreateCommand,
  TemperatureModuleDeactivateCreateCommand,
  TCOpenLidCreateCommand,
} from '@opentrons/shared-data'
import type { CreateLiveCommandMutateParams } from '@opentrons/react-api-client/src/runs/useCreateLiveCommandMutation'
import type { AttachedModule } from '../../redux/modules/types'

type prepCommandForModuleCalibrationTypes =
  | 'thermocycler/deactivateLid'
  | 'thermocycler/deactivateBlock'
  | 'temperatureModule/deactivate'
  | 'heaterShaker/deactivateShaker'
  | 'heaterShaker/deactivateHeater'
  | 'thermocycler/openLid'
  | 'heaterShaker/openLabwareLatch'

function getPrepCommandForModuleCalibration(
  prepCommandForModuleCalibrationTypes: prepCommandForModuleCalibrationTypes,
  moduleId: string,
  createLiveCommand: UseMutateAsyncFunction<
    CommandData,
    unknown,
    CreateLiveCommandMutateParams,
    unknown
  >
): void {
  const prepCommandForModuleCalibration:
    | TemperatureModuleDeactivateCreateCommand
    | HeaterShakerDeactivateHeaterCreateCommand
    | TCDeactivateLidCreateCommand
    | TCDeactivateBlockCreateCommand
    | HeaterShakerDeactivateShakerCreateCommand
    | HeaterShakerOpenLatchCreateCommand
    | TCOpenLidCreateCommand = {
    commandType: prepCommandForModuleCalibrationTypes,
    params: {
      moduleId: moduleId,
    },
  }
  createLiveCommand({
    command: prepCommandForModuleCalibration,
  }).catch((e: Error) => {
    console.error(
      `error deactivating module status with command type ${prepCommandForModuleCalibration.commandType}: ${e.message}`
    )
  })
}

export async function emitPrepCommandsForModuleCalibration(
  module: AttachedModule,
  createLiveCommand: UseMutateAsyncFunction<
    CommandData,
    unknown,
    CreateLiveCommandMutateParams,
    unknown
  >
): Promise<void> {
  if (module.moduleType === HEATERSHAKER_MODULE_TYPE) {
    if (module.data.speedStatus !== 'idle') {
      await getPrepCommandForModuleCalibration(
        'heaterShaker/deactivateShaker',
        module.id,
        createLiveCommand
      )
    }
    if (
      module.data.temperatureStatus !== 'idle' &&
      module.data.status !== 'idle'
    ) {
      await getPrepCommandForModuleCalibration(
        'heaterShaker/deactivateHeater',
        module.id,
        createLiveCommand
      )
    }
    if (
      module.data.labwareLatchStatus !== 'idle_open' &&
      module.data.labwareLatchStatus !== 'opening'
    ) {
      await getPrepCommandForModuleCalibration(
        'heaterShaker/openLabwareLatch',
        module.id,
        createLiveCommand
      )
    }
  }
  if (module.moduleType === THERMOCYCLER_MODULE_TYPE) {
    if (module.data.lidTargetTemperature != null) {
      await getPrepCommandForModuleCalibration(
        'thermocycler/deactivateLid',
        module.id,
        createLiveCommand
      )
    }
    if (module.data.targetTemperature != null) {
      await getPrepCommandForModuleCalibration(
        'thermocycler/deactivateBlock',
        module.id,
        createLiveCommand
      )
    }
    if (module.data.lidStatus !== 'open') {
      await getPrepCommandForModuleCalibration(
        'thermocycler/openLid',
        module.id,
        createLiveCommand
      )
    }
  }
  if (
    module.moduleType === TEMPERATURE_MODULE_TYPE &&
    module.data.status !== 'idle'
  ) {
    await getPrepCommandForModuleCalibration(
      'temperatureModule/deactivate',
      module.id,
      createLiveCommand
    )
  }
}
