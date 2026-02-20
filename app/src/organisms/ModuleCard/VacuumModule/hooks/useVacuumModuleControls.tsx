import noop from 'lodash/noop'

import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { VACUUM_MODULE_TYPE } from '@opentrons/shared-data'

import { useModuleCommandAnalytics } from '/app/redux-resources/analytics'

import type { CreateCommand, ModuleOnlyParams } from '@opentrons/shared-data'
import type { AttachedModule } from '/app/redux/modules/types'

// TODO (nd: 02/20/2026): Refine and move these command types to shared-data/command/types/module.ts
// once vacuum module commands are finalized in protocol engine
interface VacuumModuleSetTargetPressureParams extends ModuleOnlyParams {
  pressure: number
}

interface VacuumModuleSetTargetPowerParams extends ModuleOnlyParams {
  power: number
}

interface VacuumModuleSetTargetPressureCreateCommand {
  commandType: 'vacuumModule/setTargetPressure'
  params: VacuumModuleSetTargetPressureParams
}

interface VacuumModuleSetTargetPowerCreateCommand {
  commandType: 'vacuumModule/setTargetPower'
  params: VacuumModuleSetTargetPowerParams
}

interface VacuumModuleDeactivateCreateCommand {
  commandType: 'vacuumModule/deactivate'
  params: ModuleOnlyParams
}

interface VacuumModuleOpenVentCreateCommand {
  commandType: 'vacuumModule/openVent'
  params: ModuleOnlyParams
}

interface VacuumModuleCloseVentCreateCommand {
  commandType: 'vacuumModule/closeVent'
  params: ModuleOnlyParams
}

type VacuumModuleCommand =
  | VacuumModuleSetTargetPressureCreateCommand
  | VacuumModuleSetTargetPowerCreateCommand
  | VacuumModuleDeactivateCreateCommand
  | VacuumModuleOpenVentCreateCommand
  | VacuumModuleCloseVentCreateCommand

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
  const { createLiveCommand } = useCreateLiveCommandMutation()
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

  const executeCommand = (command: VacuumModuleCommand): void => {
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
      commandType: 'vacuumModule/setTargetPressure',
      params: {
        moduleId: module.id,
        pressure,
      },
    }
    executeCommand(command)
  }

  const setVacuumPower = (power: number): void => {
    const command: VacuumModuleSetTargetPowerCreateCommand = {
      commandType: 'vacuumModule/setTargetPower',
      params: { moduleId: module.id, power },
    }
    executeCommand(command)
  }

  const deactivateVacuum = (): void => {
    const command: VacuumModuleDeactivateCreateCommand = {
      commandType: 'vacuumModule/deactivate',
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
