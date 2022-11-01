import { SECTIONS, FLOWS } from './constants'
import { useCreateCommandMutation } from '@opentrons/react-api-client'
import { PipetteMount } from '@opentrons/shared-data'

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
}

export interface DetachStemStep {
  section: typeof SECTIONS.DETACH_STEM
}

export interface AttachStemStep {
  section: typeof SECTIONS.ATTACH_STEM
}

export interface ResultsStep {
  section: typeof SECTIONS.RESULTS
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
  proceed?: () => void
  goBack?: () => void
}
