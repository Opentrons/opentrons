import type { AttachedModule } from '@opentrons/api-client'
import type { CreateCommand } from '@opentrons/shared-data'
import type { PipetteInformation } from '/app/redux/pipettes'
import type { FLOWS, SECTIONS } from './constants'

export type ModuleCalibrationWizardStep =
  | BeforeBeginningStep
  | SelectLocationStep
  | PlaceAdapterStep
  | AttachProbeStep
  | DetachProbeStep
  | SuccessStep
  | SelectModuleStep
  | CloseDoorStep
  | InstallShuttleStep
  | UpdateFirmwareStep
  | CheckInstallationPinsStep

export interface ModuleCalibrationWizardStepProps {
  proceed: () => void
  goBack: () => void
  chainRunCommands?: (
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ) => Promise<unknown>
  isRobotMoving: boolean
  maintenanceRunId?: string
  attachedModule: AttachedModule
  attachedPipette: PipetteInformation
  errorMessage: string | null
  setErrorMessage: (message: string | null) => void
  isOnDevice: boolean | null
}

export type ModuleWizardFlow = typeof FLOWS.SETUP

export interface BeforeBeginningStep {
  section: typeof SECTIONS.BEFORE_BEGINNING
}
export interface SelectModuleStep {
  section: typeof SECTIONS.SELECT_MODULE
}
export interface CloseDoorStep {
  section: typeof SECTIONS.CLOSE_DOOR
}
export interface InstallShuttleStep {
  section: typeof SECTIONS.INSTALL_SHUTTLE
}
export interface UpdateFirmwareStep {
  section: typeof SECTIONS.UPDATE_FIRMWARE
}
export interface CheckInstallationPinsStep {
  section: typeof SECTIONS.CHECK_INSTALLATION_PINS
}
export interface SelectLocationStep {
  section: typeof SECTIONS.SELECT_LOCATION
}
export interface PlaceAdapterStep {
  section: typeof SECTIONS.PLACE_ADAPTER
}
export interface AttachProbeStep {
  section: typeof SECTIONS.ATTACH_PROBE
}
export interface DetachProbeStep {
  section: typeof SECTIONS.DETACH_PROBE
}
export interface SuccessStep {
  section: typeof SECTIONS.SUCCESS
}
