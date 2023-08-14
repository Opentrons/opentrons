import { AttachedModule } from '@opentrons/api-client'
import type { CreateCommand } from '@opentrons/shared-data'
import { SECTIONS } from './constants'

export type ModuleCalibrationWizardStep =
  | BeforeBeginningStep
  | FirmwareUpdateStep
  | SelectLocationStep
  | PlaceAdapterStep
  | AttachProbeStep
  | SuccessStep

export interface ModuleCalibrationWizardStepProps {
  proceed: () => void
  goBack: () => void
  chainRunCommands: (
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ) => Promise<unknown>
  isRobotMoving: boolean
  maintenanceRunId: string
  attachedModule: AttachedModule
  errorMessage: string | null
  setErrorMessage: (message: string | null) => void
}

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
export interface SuccessStep {
  section: typeof SECTIONS.SUCCESS
}
