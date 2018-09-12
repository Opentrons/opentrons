// @flow
import type {PauseFormData} from '../step-generation'
import type {FormData, StepIdType, StepType, TransferLikeStepType} from '../form-types'

// sections of the form that are expandable/collapsible
export type FormSectionState = {aspirate: boolean, dispense: boolean}
export type FormSectionNames = 'aspirate' | 'dispense'

// timeline start and end
export const START_TERMINAL_ITEM_ID: '__initial_setup__' = '__initial_setup__'
export const END_TERMINAL_ITEM_ID: '__end__' = '__end__'
export type TerminalItemId = typeof START_TERMINAL_ITEM_ID | typeof END_TERMINAL_ITEM_ID

export type SubstepIdentifier = {|
  stepId: StepIdType,
  substepIndex: number,
|} | null

export type NamedIngred = {|
  id: string,
  name: string,
|}

export type StepItemSourceDestRow = {|
  substepIndex?: number,
  sourceIngredients?: Array<NamedIngred>,
  destIngredients?: Array<NamedIngred>,
  sourceWell?: ?string,
  destWell?: ?string,
  volume?: ?number,
|}

export type StepItemSourceDestRowMulti = {
  ...StepItemSourceDestRow,
  channelId: number,
}

export type SourceDestSubstepItemSingleChannel = {|
  multichannel: false,
  stepType: TransferLikeStepType | 'mix',
  parentStepId: StepIdType,
  rows: Array<{|
    ...StepItemSourceDestRow,
    volume?: number,
  |}>,
|}

export type SourceDestSubstepItemMultiChannel = {|
  multichannel: true,
  stepType: TransferLikeStepType | 'mix',
  parentStepId: StepIdType,
  volume?: ?number, // uniform volume for all steps
  multiRows: Array<Array<StepItemSourceDestRowMulti>>, // Array of arrays.
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
  formData: ?FormData,
}

export type SubSteps = {[StepIdType]: ?SubstepItemData}
