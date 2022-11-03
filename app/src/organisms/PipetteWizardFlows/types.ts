import { SECTIONS, FLOWS } from './constants'
import { useCreateCommandMutation } from '@opentrons/react-api-client'
import { PipetteMount } from '@opentrons/shared-data'
import type { CreateCommand } from '@opentrons/shared-data'
import type { AttachedPipettesByMount } from '../../redux/pipettes/types'

export type PipetteWizardStep =
  | BeforeBeginningStep
  | DetachStemStep
  | AttachStemStep
  | ResultsStep

export type PipetteWizardFlow =
  | typeof FLOWS.ATTACH
  | typeof FLOWS.DETACH
  | typeof FLOWS.CALIBRATE

export interface BeforeBeginningStep {
  section: typeof SECTIONS.BEFORE_BEGINNING
  mount: PipetteMount
  flowType: PipetteWizardFlow
}

export interface DetachStemStep {
  section: typeof SECTIONS.DETACH_STEM
  mount: PipetteMount
  flowType: PipetteWizardFlow
}

export interface AttachStemStep {
  section: typeof SECTIONS.ATTACH_STEM
  mount: PipetteMount
  flowType: PipetteWizardFlow
}

export interface ResultsStep {
  section: typeof SECTIONS.RESULTS
  mount: PipetteMount
  flowType: PipetteWizardFlow
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
