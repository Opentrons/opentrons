import noop from 'lodash/noop'

import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { VACUUM_MODULE_TYPE } from '@opentrons/shared-data'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useModuleCommandAnalytics } from '/app/redux-resources/analytics'

import type {
  CreateCommand,
  ModuleCreateCommand,
  VacuumModuleCloseVentCreateCommand,
  VacuumModuleOpenVentCreateCommand,
  VacuumModuleSetTargetPowerCreateCommand,
  VacuumModuleSetTargetPressureCreateCommand,
  VacuumModuleStopPumpCreateCommand,
} from '@opentrons/shared-data'
import type { AttachedModule } from '@opentrons/api-client'

interface UseVacuumModuleControlsResult {
  setVacuumPressure: (pressure: number) => void
  setVacuumPower: (power: number) => void
  deactivateVacuum: () => void
  openVent: () => void
  closeVent: () => void
}

export function useVacuumModuleControls(
  module: AttachedModule
): UseVacuumModuleControlsResult {
  const documentationState = useDocumentationState()
  const { createLiveCommand } = useCreateLiveCommandMutation(documentationState)
  const { reportModuleCommand } = useModuleCommandAnalytics()

  if (module.moduleType !== VACUUM_MODULE_TYPE) {
    return {
      setVacuumPressure: noop,
      setVacuumPower: noop,
      deactivateVacuum: noop,
      openVent: noop,
      closeVent: noop,
    }
  }

  const executeCommand = (command: ModuleCreateCommand): void => {
    // TODO: Remove type assertion when vacuum commands are added to shared-data
    createLiveCommand({ command: command as unknown as CreateCommand })
      .then(() => {
        reportModuleCommand({
          kind: 'liveCommand',
          moduleType: module.moduleType,
          analyticCommand: command.commandType,
          result: { status: 'succeeded', data: undefined },
          serialNumber: module.serialNumber,
          errorDetails: '',
          firmwareVersion: module.firmwareVersion,
        })
      })
      .catch((e: Error) => {
        reportModuleCommand({
          kind: 'liveCommand',
          moduleType: module.moduleType,
          analyticCommand: command.commandType,
          result: { status: 'failed', data: undefined },
          errorDetails: e.message,
          serialNumber: module.serialNumber,
          firmwareVersion: module.firmwareVersion,
        })
        console.error(
          `error setting module status with command type ${command.commandType}: ${e.message}`
        )
      })
  }

  const setVacuumPressure = (pressure: number): void => {
    const command: VacuumModuleSetTargetPressureCreateCommand = {
      commandType: 'vacuumModule/startSetVacuumPressure',
      params: {
        moduleId: module.id,
        gaugePressure: pressure,
      },
    }
    executeCommand(command)
  }

  const setVacuumPower = (power: number): void => {
    const command: VacuumModuleSetTargetPowerCreateCommand = {
      commandType: 'vacuumModule/startSetVacuumPower',
      params: { moduleId: module.id, percentPower: power },
    }
    executeCommand(command)
  }

  const deactivateVacuum = (): void => {
    const command: VacuumModuleStopPumpCreateCommand = {
      commandType: 'vacuumModule/stopVacuum',
      params: { moduleId: module.id },
    }
    executeCommand(command)
  }

  const openVent = (): void => {
    const command: VacuumModuleOpenVentCreateCommand = {
      commandType: 'vacuumModule/openVent',
      params: { moduleId: module.id },
    }
    executeCommand(command)
  }

  const closeVent = (): void => {
    const command: VacuumModuleCloseVentCreateCommand = {
      commandType: 'vacuumModule/closeVent',
      params: { moduleId: module.id },
    }
    executeCommand(command)
  }

  return {
    setVacuumPressure,
    setVacuumPower,
    deactivateVacuum,
    openVent,
    closeVent,
  }
}
