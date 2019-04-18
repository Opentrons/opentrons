// @flow
import type { DelayArgs, CommandCreatorArgs } from '../step-generation'
import type {
  FormData,
  StepIdType,
  StepFieldName,
  StepType,
} from '../form-types'
import type { FormError } from './formLevel/errors'

// timeline start and end
export const START_TERMINAL_ITEM_ID: '__initial_setup__' = '__initial_setup__'
export const END_TERMINAL_ITEM_ID: '__end__' = '__end__'
export type TerminalItemId =
  | typeof START_TERMINAL_ITEM_ID
  | typeof END_TERMINAL_ITEM_ID

export type WellIngredientNames = { [ingredId: string]: string }
export type WellIngredientVolumeData = {
  [ingredId: string]: { volume: number },
}
export type TipLocation = { labware: string, well: string }

export type SubstepIdentifier = {|
  stepId: StepIdType,
  substepIndex: number,
|} | null

export type NamedIngred = {|
  id: string,
  name: string,
|}

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

// NOTE: delay is NOT a source-dest-style command creator, this type exists
// mostly to tell flow that :/
type SourceDestCommandCreatorName =
  | 'transfer'
  | 'distribute'
  | 'consolidate'
  | 'mix'

export type SourceDestSubstepItemSingleChannel = {|
  multichannel: false,
  commandCreatorFnName: SourceDestCommandCreatorName,
  parentStepId: StepIdType,
  rows: Array<StepItemSourceDestRow>,
|}

export type SourceDestSubstepItemMultiChannel = {|
  multichannel: true,
  commandCreatorFnName: SourceDestCommandCreatorName,
  parentStepId: StepIdType,
  volume?: ?number, // uniform volume for all steps
  multiRows: Array<Array<StepItemSourceDestRow>>, // Array of arrays.
  // NOTE: "Row" means a tabular row on the steplist, NOT a "row" of wells on the deck
|}

export type SourceDestSubstepItem =
  | SourceDestSubstepItemSingleChannel
  | SourceDestSubstepItemMultiChannel

export type SubstepItemData = SourceDestSubstepItem | DelayArgs // Pause substep uses same data as delay args

export type StepItemData = {
  id: StepIdType,
  title: string,
  stepType: StepType,
  description?: ?string,
  formData: ?FormData,
}

export type SubSteps = { [StepIdType]: ?SubstepItemData }

export type StepFormAndFieldErrors = {
  field?: { [StepFieldName]: Array<string> },
  form?: Array<FormError>,
}

export type StepArgsAndErrors = {
  errors: StepFormAndFieldErrors,
  stepArgs: CommandCreatorArgs | null, // TODO: incompleteData field when this is null?
}
