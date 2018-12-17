// @flow
import type {PauseFormData} from '../../step-generation'
import type {
  StepIdType,
  TransferLikeStepType,
} from '../../form-types'
import type {WellIngredientVolumeData, TipLocation} from '../../steplist/types'

// sections of the form that are expandable/collapsible
export type FormSectionState = {aspirate: boolean, dispense: boolean}
export type FormSectionNames = 'aspirate' | 'dispense'

export type SourceDestData = {
  wells: Array<string>,
  preIngreds: WellIngredientVolumeData,
  postIngreds: WellIngredientVolumeData,
}

export type SubstepTimelineFrame = {
  substepIndex?: number,
  activeTips: ?TipLocation,
  source?: SourceDestData,
  dest?: SourceDestData,
  volume?: ?number,
  channelId?: number,
}

export type SubstepWellData = {
  well: string,
  preIngreds: WellIngredientVolumeData,
  postIngreds: WellIngredientVolumeData,
}

export type StepItemSourceDestRow = {
  activeTips: ?TipLocation,
  substepIndex?: number,
  source?: SubstepWellData,
  dest?: SubstepWellData,
  volume?: ?number,
  channelId?: number,
}

export type SourceDestSubstepItemSingleChannel = {|
  multichannel: false,
  stepType: TransferLikeStepType | 'mix',
  parentStepId: StepIdType,
  rows: Array<StepItemSourceDestRow>,
|}

export type SourceDestSubstepItemMultiChannel = {|
  multichannel: true,
  stepType: TransferLikeStepType | 'mix',
  parentStepId: StepIdType,
  volume?: ?number, // uniform volume for all steps
  multiRows: Array<Array<StepItemSourceDestRow>>, // Array of arrays.
  // NOTE: "Row" means a tabular row on the steplist, NOT a "row" of wells on the deck
|}

export type SourceDestSubstepItem = SourceDestSubstepItemSingleChannel | SourceDestSubstepItemMultiChannel

export type SubstepItemData =
  | SourceDestSubstepItem
  | PauseFormData // Pause substep uses same data as processed form

export type SubSteps = {[StepIdType]: ?SubstepItemData}
