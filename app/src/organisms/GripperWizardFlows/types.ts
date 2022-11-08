import { SECTIONS, FLOWS } from './constants'
import { useCreateCommandMutation } from '@opentrons/react-api-client'
import { PipetteMount } from '@opentrons/shared-data'
import type { CreateCommand } from '@opentrons/shared-data'

export type GripperWizardStep =
  | BeforeBeginningStep
  | DetachProbeStep
  | AttachProbeStep
  | ResultsStep
  | MountGripperStep
  | DetachGripperStep

export type GripperWizardFlowType =
  | typeof FLOWS.ATTACH
  | typeof FLOWS.DETACH
  | typeof FLOWS.CALIBRATE

export interface BaseStep {
  flowType: GripperWizardFlowType
}
export interface BeforeBeginningStep extends BaseStep {
  section: typeof SECTIONS.BEFORE_BEGINNING
  flowType: GripperWizardFlowType
}

export interface DetachProbeStep extends BaseStep {
  section: typeof SECTIONS.DETACH_PROBE
  flowType: GripperWizardFlowType
}

export interface AttachProbeStep extends BaseStep {
  section: typeof SECTIONS.ATTACH_PROBE
  flowType: GripperWizardFlowType
}

export interface ResultsStep extends BaseStep {
  section: typeof SECTIONS.RESULTS
  flowType: GripperWizardFlowType
}
export interface MountGripperStep extends BaseStep {
  section: typeof SECTIONS.MOUNT_GRIPPER
}
export interface DetachGripperStep extends BaseStep {
  section: typeof SECTIONS.DETACH_GRIPPER
}

type CreateCommandMutate = ReturnType<
  typeof useCreateCommandMutation
>['createCommand']
export type CreateRunCommand = (
  params: Parameters<CreateCommandMutate>,
  options?: Parameters<CreateCommandMutate>[1]
) => ReturnType<CreateCommandMutate>

export interface GripperWizardStepProps {
  flowType: GripperWizardFlowType
  proceed: () => void
  goBack: () => void
  chainRunCommands: (commands: CreateCommand[]) => Promise<unknown>
  isRobotMoving: boolean
  runId: string
  attachedGripper: {} | null
  setIsBetweenCommands: React.Dispatch<React.SetStateAction<boolean>>
}
