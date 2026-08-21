import type { AttachedModule } from '@opentrons/api-client'
import type { CreateCommand } from '@opentrons/shared-data'
import type { PipetteInformation } from '/app/redux/pipettes'
import type { ACTIONS, FLOWS, SECTIONS } from './constants'

export type ModuleSetupWizardStep =
  | BeforeBeginningStep
  | SelectLocationStep
  | PlaceAdapterStep
  | AttachProbeStep
  | DetachProbeStep
  | SuccessStep
  | CloseDoorStep
  | CheckInstallationPinsStep
  | InstallShuttleStep
  | UpdateFirmwareStep
  | VerifyVacuumStep

export type ModuleWizardAction =
  | ModuleWizardBuildFlowAction
  | ModuleWizardRestartFlowAction
  | ModuleWizardProceedAction
  | ModuleWizardGoBackAction
  | ModuleWizardPatchModuleAction

export interface ModuleWizardState {
  currentStepIndex: number
  currentStep: ModuleSetupWizardStep | null
  totalStepCount: number
  stepsInFlow: ModuleSetupWizardStep[]
  attachedModule: AttachedModule | null
}

interface ModuleWizardBuildFlowAction {
  type: typeof ACTIONS.BUILD_FLOW
  attachedModule: AttachedModule
}
interface ModuleWizardRestartFlowAction {
  type: typeof ACTIONS.RESTART_FLOW
}
interface ModuleWizardProceedAction {
  type: typeof ACTIONS.PROCEED
}
interface ModuleWizardGoBackAction {
  type: typeof ACTIONS.GO_BACK
}
interface ModuleWizardPatchModuleAction {
  type: typeof ACTIONS.PATCH_MODULE
  attachedModule: AttachedModule
}
export interface ModuleSetupWizardBaseStepProps {
  proceed: () => void
  goBack: () => void
  restartSetup: () => void
  chainRunCommands?: (
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ) => Promise<unknown>
  isRobotMoving: boolean
  isModuleUpdating: boolean
  setIsModuleUpdating: (updating: boolean) => void
  maintenanceRunId: string | null
  attachedModule: AttachedModule
  errorMessage: string | null
  setErrorMessage: (message: string | null) => void
  isOnDevice: boolean
}

export interface ModuleSetupWizardRequiresPipetteStepProps extends ModuleSetupWizardBaseStepProps {
  attachedPipette: PipetteInformation
}

export interface ModuleSetupWizardMaybePipetteStepProps extends ModuleSetupWizardBaseStepProps {
  attachedPipette: PipetteInformation | null
}

export type ModuleSetupWizardStepProps =
  | ModuleSetupWizardMaybePipetteStepProps
  | ModuleSetupWizardRequiresPipetteStepProps

export type ModuleWizardFlow = typeof FLOWS.SETUP

export interface BeforeBeginningStep {
  section: typeof SECTIONS.BEFORE_BEGINNING
}
export interface CloseDoorStep {
  section: typeof SECTIONS.CLOSE_DOOR
}
export interface CheckInstallationPinsStep {
  section: typeof SECTIONS.CHECK_INSTALLATION_PINS
}
export interface InstallShuttleStep {
  section: typeof SECTIONS.INSTALL_SHUTTLE
}
export interface UpdateFirmwareStep {
  section: typeof SECTIONS.UPDATE_FIRMWARE
}
export interface VerifyVacuumStep {
  section: typeof SECTIONS.VERIFY_VACUUM
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
