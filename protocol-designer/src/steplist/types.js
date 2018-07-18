// @flow
import type {PauseFormData} from '../step-generation'
import type {FormData, StepIdType, StepType, TransferLikeStepType} from '../form-types'

// sections of the form that are expandable/collapsible
export type FormSectionState = {aspirate: boolean, dispense: boolean}
export type FormSectionNames = 'aspirate' | 'dispense'

export const END_STEP: '__end__' = '__end__' // Special ID of "End" pseudo-step.
// NOTE: explicit type annotation so that typeof END_STEP is `'__end__'` and not `string`

export type SubstepIdentifier = {|
  stepId: StepIdType,
  substepIndex: number
|} | null

export type NamedIngred = {|
  id: string,
  name: string
|}

export type StepItemSourceDestRow = {|
  substepIndex?: number,
  sourceIngredients?: Array<NamedIngred>,
  destIngredients?: Array<NamedIngred>,
  sourceWell?: ?string,
  destWell?: ?string,
  volume?: ?number
|}

export type StepItemSourceDestRowMulti = {
  ...StepItemSourceDestRow,
  channelId: number
}

export type SourceDestSubstepItemSingleChannel = {|
  multichannel: false,
  stepType: TransferLikeStepType | 'mix',
  parentStepId: StepIdType,
  rows: Array<{|
    ...StepItemSourceDestRow,
    volume?: number
  |}>
|}

export type SourceDestSubstepItemMultiChannel = {|
  multichannel: true,
  stepType: TransferLikeStepType | 'mix',
  parentStepId: StepIdType,
  volume?: ?number, // uniform volume for all steps
  multiRows: Array<Array<StepItemSourceDestRowMulti>> // Array of arrays.
  // NOTE: "Row" means a tabular row on the steplist, NOT a "row" of wells on the deck
|}

export type SourceDestSubstepItem = SourceDestSubstepItemSingleChannel | SourceDestSubstepItemMultiChannel

export type SubstepItemData =
  | SourceDestSubstepItem
  | PauseFormData // Pause substep uses same data as processed form

export type StepItemData = {
  id: StepIdType,
  title: string,
  stepType: StepType,
  description?: ?string,
  formData: ?FormData
}

export type SubSteps = {[StepIdType]: ?SubstepItemData}

export type StepIdTypeWithEnd = StepIdType | typeof END_STEP
