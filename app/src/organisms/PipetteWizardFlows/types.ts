import { SECTIONS, FLOWS } from './constants'
import { useCreateCommandMutation } from '@opentrons/react-api-client'
import { PipetteMount } from '@opentrons/shared-data'
import type { CreateCommand } from '@opentrons/shared-data'
import type { AttachedPipettesByMount } from '../../redux/pipettes/types'

export type PipetteWizardStep =
  | BeforeBeginningStep
  | DetachProbeStep
  | AttachProbeStep
  | ResultsStep
  | MountPipetteStep
  | DetachPipetteStep

export type PipetteWizardFlow =
  | typeof FLOWS.ATTACH
  | typeof FLOWS.DETACH
  | typeof FLOWS.CALIBRATE

export interface BaseStep {
  mount: PipetteMount
  flowType: PipetteWizardFlow
}
export interface BeforeBeginningStep extends BaseStep {
  section: typeof SECTIONS.BEFORE_BEGINNING
  mount: PipetteMount
  flowType: PipetteWizardFlow
}

export interface DetachProbeStep extends BaseStep {
  section: typeof SECTIONS.DETACH_PROBE
  mount: PipetteMount
  flowType: PipetteWizardFlow
}

export interface AttachProbeStep extends BaseStep {
  section: typeof SECTIONS.ATTACH_PROBE
  mount: PipetteMount
  flowType: PipetteWizardFlow
}

export interface ResultsStep extends BaseStep {
  section: typeof SECTIONS.RESULTS
  mount: PipetteMount
  flowType: PipetteWizardFlow
}
export interface MountPipetteStep extends BaseStep {
  section: typeof SECTIONS.MOUNT_PIPETTE
}
export interface DetachPipetteStep extends BaseStep {
  section: typeof SECTIONS.DETACH_PIPETTE
}

type CreateCommandMutate = ReturnType<
  typeof useCreateCommandMutation
>['createCommand']
export type CreateRunCommand = (
  params: Parameters<CreateCommandMutate>,
  options?: Parameters<CreateCommandMutate>[1]
) => ReturnType<CreateCommandMutate>

export interface PipetteWizardStepProps {
  flowType: PipetteWizardFlow
  mount: PipetteMount
  proceed: () => void
  goBack: () => void
  chainRunCommands: (commands: CreateCommand[]) => Promise<unknown>
  isRobotMoving: boolean
  runId: string
  attachedPipette: AttachedPipettesByMount
  setIsBetweenCommands: React.Dispatch<React.SetStateAction<boolean>>
}
