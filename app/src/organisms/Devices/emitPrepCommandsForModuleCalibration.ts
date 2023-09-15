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

type PrepCommands =
  | TemperatureModuleDeactivateCreateCommand
  | HeaterShakerDeactivateHeaterCreateCommand
  | TCDeactivateLidCreateCommand
  | TCDeactivateBlockCreateCommand
  | HeaterShakerDeactivateShakerCreateCommand
  | HeaterShakerOpenLatchCreateCommand
  | TCOpenLidCreateCommand

type PrepCommandForModuleCalibrationTypes =
  | 'thermocycler/deactivateLid'
  | 'thermocycler/deactivateBlock'
  | 'temperatureModule/deactivate'
  | 'heaterShaker/deactivateShaker'
  | 'heaterShaker/deactivateHeater'
  | 'thermocycler/openLid'
  | 'heaterShaker/openLabwareLatch'

function prepCommandForModuleCalibration(
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>,
  prepCommandForModuleCalibrationTypes: PrepCommandForModuleCalibrationTypes,
  moduleId: string,
  createLiveCommand: UseMutateAsyncFunction<
    CommandData,
    unknown,
    CreateLiveCommandMutateParams,
    unknown
  >
): void {
  const prepCommandForModuleCalibration: PrepCommands = {
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
    setErrorMessage(e.message)
  })
}

export async function emitPrepCommandsForModuleCalibration(
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  module: AttachedModule,
  createLiveCommand: UseMutateAsyncFunction<
    CommandData,
    unknown,
    CreateLiveCommandMutateParams,
    unknown
  >
): Promise<void> {
  setIsLoading(true)

  try {
    switch (module.moduleType) {
      case HEATERSHAKER_MODULE_TYPE: {
        if (module.data.speedStatus !== 'idle') {
          await prepCommandForModuleCalibration(
            setErrorMessage,
            'heaterShaker/deactivateShaker',
            module.id,
            createLiveCommand
          )
        }
        if (
          module.data.temperatureStatus !== 'idle' &&
          module.data.status !== 'idle'
        ) {
          await prepCommandForModuleCalibration(
            setErrorMessage,
            'heaterShaker/deactivateHeater',
            module.id,
            createLiveCommand
          )
        }
        if (
          module.data.labwareLatchStatus !== 'idle_open' &&
          module.data.labwareLatchStatus !== 'opening'
        ) {
          await prepCommandForModuleCalibration(
            setErrorMessage,
            'heaterShaker/openLabwareLatch',
            module.id,
            createLiveCommand
          )
        }
        break
      }

      case THERMOCYCLER_MODULE_TYPE: {
        if (module.data.lidTargetTemperature != null) {
          await prepCommandForModuleCalibration(
            setErrorMessage,
            'thermocycler/deactivateLid',
            module.id,
            createLiveCommand
          )
        }
        if (module.data.targetTemperature != null) {
          await prepCommandForModuleCalibration(
            setErrorMessage,
            'thermocycler/deactivateBlock',
            module.id,
            createLiveCommand
          )
        }
        if (module.data.lidStatus !== 'open') {
          await prepCommandForModuleCalibration(
            setErrorMessage,
            'thermocycler/openLid',
            module.id,
            createLiveCommand
          )
        }
        break
      }

      case TEMPERATURE_MODULE_TYPE: {
        if (module.data.status !== 'idle') {
          await prepCommandForModuleCalibration(
            setErrorMessage,
            'temperatureModule/deactivate',
            module.id,
            createLiveCommand
          )
        }
        break
      }
    }
    setIsLoading(false)
  } catch (error: unknown) {
    if (error instanceof Error) {
      setErrorMessage(error.message)
    } else {
      setErrorMessage('Unknown error occurred')
    }
    setIsLoading(false)
  }
}
