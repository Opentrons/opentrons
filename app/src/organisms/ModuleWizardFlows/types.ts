import { AttachedModule } from '@opentrons/api-client'
import { FLOWS, SECTIONS } from './constants'
import type { CreateCommand } from '@opentrons/shared-data'
import type { PipetteInformation } from '../Devices/hooks'

export type ModuleCalibrationWizardStep =
  | BeforeBeginningStep
  | FirmwareUpdateStep
  | SelectLocationStep
  | PlaceAdapterStep
  | AttachProbeStep
  | DetachProbeStep
  | SuccessStep

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
  slotName: string
  isOnDevice: boolean | null
}

export type ModuleWizardFlow = typeof FLOWS.CALIBRATE

export interface BeforeBeginningStep {
  section: typeof SECTIONS.BEFORE_BEGINNING
}
export interface FirmwareUpdateStep {
  section: typeof SECTIONS.FIRMWARE_UPDATE
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
