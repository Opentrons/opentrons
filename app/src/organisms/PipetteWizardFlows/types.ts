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
  | MountingPlateStep
  | CarriageStep

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
export interface CarriageStep extends BaseStep {
  section: typeof SECTIONS.CARRIAGE
}
export interface MountingPlateStep extends BaseStep {
  section: typeof SECTIONS.MOUNTING_PLATE
}

type CreateCommandMutate = ReturnType<
  typeof useCreateCommandMutation
>['createCommand']
export type CreateRunCommand = (
  params: Parameters<CreateCommandMutate>,
  options?: Parameters<CreateCommandMutate>[1]
) => ReturnType<CreateCommandMutate>

export type SelectablePipettes = '96-Channel' | 'Single-Channel_and_8-Channel'

export interface PipetteWizardStepProps {
  flowType: PipetteWizardFlow
  mount: PipetteMount
  proceed: () => void
  goBack: () => void
  chainRunCommands: (
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ) => Promise<unknown>
  isRobotMoving: boolean
  runId: string
  attachedPipette: AttachedPipettesByMount
  setShowErrorMessage: React.Dispatch<React.SetStateAction<string | null>>
  errorMessage: string | null
  robotName: string
  selectedPipette: SelectablePipettes
}
