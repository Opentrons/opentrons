import { SECTIONS, GRIPPER_FLOW_TYPES, FRONT_JAW, REAR_JAW } from './constants'
import { useCreateCommandMutation } from '@opentrons/react-api-client'
import type { CreateCommand } from '@opentrons/shared-data'

export type GripperWizardStep =
  | BeforeBeginningStep
  | RemovePinStep
  | InsertPinStep
  | ResultsStep
  | MountGripperStep
  | UnmountGripperStep
  | SuccessfullyAttachedStep
  | SuccessfullyDetachedStep
  | SuccessfullyRecalibratedStep
  | SuccessfullyAttachedAndCalibratedStep

export type GripperWizardFlowType =
  | typeof GRIPPER_FLOW_TYPES.ATTACH
  | typeof GRIPPER_FLOW_TYPES.DETACH
  | typeof GRIPPER_FLOW_TYPES.RECALIBRATE


export interface BeforeBeginningStep {
  section: typeof SECTIONS.BEFORE_BEGINNING
}
export interface RemovePinStep {
  section: typeof SECTIONS.REMOVE_PIN
}
export interface InsertPinStep {
  section: typeof SECTIONS.INSERT_PIN
  jaw: typeof FRONT_JAW | typeof REAR_JAW
}
export interface ResultsStep {
  section: typeof SECTIONS.RESULTS
}
export interface MountGripperStep {
  section: typeof SECTIONS.MOUNT_GRIPPER
}
export interface UnmountGripperStep {
  section: typeof SECTIONS.UNMOUNT_GRIPPER
}
export interface SuccessfullyAttachedStep {
  section: typeof SECTIONS.SUCCESSFULLY_ATTACHED
}
export interface SuccessfullyAttachedAndCalibratedStep {
  section: typeof SECTIONS.SUCCESSFULLY_ATTACHED_AND_CALIBRATED
}
export interface SuccessfullyRecalibratedStep {
  section: typeof SECTIONS.SUCCESSFULLY_RECALIBRATED
}
export interface SuccessfullyDetachedStep {
  section: typeof SECTIONS.SUCCESSFULLY_DETACHED
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
