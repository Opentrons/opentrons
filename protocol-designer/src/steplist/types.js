// @flow
import type {IconName} from '@opentrons/components'
import type {ConsolidateFormData, PauseFormData, TransferFormData} from '../step-generation'

// sections of the form that are expandable/collapsible
export type FormSectionState = {aspirate: boolean, dispense: boolean}
export type FormSectionNames = 'aspirate' | 'dispense'

// TODO Ian 2018-01-16 factor out to steplist/constants.js ?
export const stepIconsByType: {[string]: IconName} = {
  'transfer': 'ot-transfer',
  'distribute': 'ot-distribute',
  'consolidate': 'ot-consolidate',
  'mix': 'ot-mix',
  'pause': 'pause',
  'deck-setup': 'flask-outline'
}

export const END_STEP: '__end__' = '__end__' // Special ID of "End" pseudo-step.
// NOTE: explicit type annotation so that typeof END_STEP is `'__end__'` and not `string`

export type StepType = $Keys<typeof stepIconsByType>

export type StepIdType = number

export type SubstepIdentifier = {|
  stepId: StepIdType,
  substepId: number
|} | null

export type NamedIngred = {|
  id: number,
  name: string
|}

export type NamedIngredsByLabware = {[labwareId: string]: {[well: string]: Array<NamedIngred>}}
export type NamedIngredsByLabwareAllSteps = Array<NamedIngredsByLabware>

export type StepItemSourceDestRow = {|
  substepId: number, // TODO should this be a string or is this ID properly a number?
  sourceIngredients?: Array<NamedIngred>,
  destIngredients?: Array<NamedIngred>,
  sourceWell?: ?string,
  destWell?: ?string
|}

export type StepItemSourceDestRowMulti = {|
  ...StepItemSourceDestRow,
  channelId: number
|}

export type TransferLikeSubstepItemSingleChannel = {|
  multichannel: false,
  stepType: 'transfer' | 'consolidate' | 'distribute',
  parentStepId: StepIdType,
  rows: Array<{|
    ...StepItemSourceDestRow,
    substepId: number,
    volume?: number
  |}>
|}

export type TransferLikeSubstepItemMultiChannel = {|
  multichannel: true,
  stepType: 'transfer' | 'consolidate' | 'distribute',
  parentStepId: StepIdType,
  volume?: number, // uniform volume for all steps
  multiRows: Array<Array<StepItemSourceDestRowMulti>> // Array of arrays.
  // NOTE: "Row" means a tabular row on the steplist, NOT a "row" of wells on the deck
|}

export type TransferLikeSubstepItem = TransferLikeSubstepItemSingleChannel | TransferLikeSubstepItemMultiChannel

export type StepSubItemData =
  | TransferLikeSubstepItem
  | PauseFormData // Pause substep uses same data as processed form

export type StepItemData = {
  id: StepIdType,
  title: string,
  stepType: StepType,
  description?: ?string,
  sourceLabwareName?: ?string,
  destLabwareName?: ?string
}

export type StepItemsWithSubsteps = StepItemData & {
  substeps: StepSubItemData | null
}

export type SubSteps = {[StepIdType]: StepSubItemData | null}

export type FormModalFields = {|
  'step-name': string,
  'step-details': string
|}

export type TransferForm = {|
  ...FormModalFields,
  stepType: 'transfer',
  id: StepIdType,

  'aspirate--labware'?: string,
  'aspirate--wells'?: Array<string>,
  'aspirate--pipette'?: string, // TODO just call this pipette, there's only one
  'aspirate--pre-wet-tip'?: boolean,
  'aspirate--touch-tip'?: boolean,
  'aspirate--air-gap--checkbox'?: boolean,
  'aspirate--air-gap--volume'?: string,
  'aspirate--mix--checkbox'?: boolean,
  'aspirate--mix--volume'?: string,
  'aspirate--mix--times'?: string,
  'aspirate--disposal-vol--checkbox'?: boolean,
  'aspirate--disposal-vol--volume'?: string,
  'aspirate--change-tip'?: 'once' | 'never' | 'always',

  'dispense--volume'?: string,
  'dispense--labware'?: string,
  'dispense--wells'?: Array<string>,
  'dispense--mix--checkbox'?: boolean,
  'dispense--mix--volume'?: string,
  'dispense--mix--times'?: string,
  'dispense--delay--checkbox'?: boolean,
  'dispense--delay-minutes'?: string,
  'dispense--delay-seconds'?: string,
  'dispense--blowout--checkbox'?: boolean,
  'dispense--blowout--labware'?: string
|}

export type ConsolidateForm = {|
  ...FormModalFields,
  stepType: 'consolidate',
  id: StepIdType,

  'aspirate--volume'?: string,
  'aspirate--labware'?: string,
  'aspirate--wells'?: Array<string>,
  'aspirate--pipette'?: string, // TODO just call this pipette, there's only one
  'aspirate--pre-wet-tip'?: boolean,
  'aspirate--touch-tip'?: boolean,
  'aspirate--air-gap--checkbox'?: boolean,
  'aspirate--air-gap--volume'?: string,
  'aspirate--mix--checkbox'?: boolean,
  'aspirate--mix--volume'?: string,
  'aspirate--mix--times'?: string,
  'aspirate--disposal-vol--checkbox'?: boolean,
  'aspirate--disposal-vol--volume'?: string,
  'aspirate--change-tip'?: 'once' | 'never' | 'always',

  'dispense--labware'?: string,
  'dispense--wells'?: Array<string>, // only one well
  'dispense--mix--checkbox'?: boolean,
  'dispense--mix--volume'?: string,
  'dispense--mix--times'?: string,
  'dispense--delay--checkbox'?: boolean,
  'dispense--delay-minutes'?: string,
  'dispense--delay-seconds'?: string,
  'dispense--blowout--checkbox'?: boolean,
  'dispense--blowout--labware'?: string
|}

export type PauseForm = {|
  ...FormModalFields,
  stepType: 'pause',
  id: StepIdType,

  'pause-for-amount-of-time'?: 'true' | 'false',
  'pause-hour'?: string,
  'pause-minute'?: string,
  'pause-second'?: string,
  'pause-message'?: string
|}

export type FormData = TransferForm | ConsolidateForm | PauseForm

export type BlankForm = {
  ...FormModalFields,
  stepType: StepType,
  id: StepIdType
}

// TODO gradually create & use definitions from step-generation/types.js
export type ProcessedFormData = TransferFormData | PauseFormData | ConsolidateFormData
