// @flow
import type { DelayArgs } from '../../step-generation'
import type { StepIdType } from '../../form-types'
import type {
  WellIngredientVolumeData,
  TipLocation,
} from '../../steplist/types'

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
  stepType: 'moveLiquid' | 'mix',
  parentStepId: StepIdType,
  rows: Array<StepItemSourceDestRow>,
|}

export type SourceDestSubstepItemMultiChannel = {|
  multichannel: true,
  stepType: 'moveLiquid' | 'mix',
  parentStepId: StepIdType,
  volume?: ?number, // uniform volume for all steps
  multiRows: Array<Array<StepItemSourceDestRow>>, // Array of arrays.
  // NOTE: "Row" means a tabular row on the steplist, NOT a "row" of wells on the deck
|}

export type SourceDestSubstepItem =
  | SourceDestSubstepItemSingleChannel
  | SourceDestSubstepItemMultiChannel

export type SubstepItemData = SourceDestSubstepItem | DelayArgs // Pause substep uses same data as processed form

export type SubSteps = { [StepIdType]: ?SubstepItemData }
