// @flow
import type {IconName} from '@opentrons/components'
import type {ConsolidateFormData} from '../step-generation'
import type {MixArgs, SharedFormDataFields, ChangeTipOptions} from '../form-types'

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

export type StepItemSourceDestRow = {|
  substepId: number, // TODO should this be a string or is this ID properly a number?
  sourceIngredients?: Array<NamedIngred>,
  destIngredients?: Array<NamedIngred>,
  sourceWell?: string,
  destWell?: string
|}

export type StepItemSourceDestRowMulti = {|
  ...StepItemSourceDestRow,
  channelId: number
|}

export type TransferishStepItemSingleChannel = {|
  multichannel: false,
  stepType: 'transfer' | 'consolidate' | 'distribute',
  parentStepId: StepIdType,
  rows: Array<{|
    ...StepItemSourceDestRow,
    volume?: number
  |}>
|}

export type TransferishStepItemMultiChannel = {|
  multichannel: true,
  stepType: 'transfer' | 'consolidate' | 'distribute',
  parentStepId: StepIdType,
  volume?: number, // uniform volume for all steps
  multiRows: Array<Array<StepItemSourceDestRowMulti>> // Array of arrays.
  // NOTE: "Row" means a tabular row on the steplist, NOT a "row" of wells on the deck
|}

export type TransferishStepItem = TransferishStepItemSingleChannel | TransferishStepItemMultiChannel

export type StepSubItemData = TransferishStepItem | {|
  stepType: 'pause',
  waitForUserInput: false,
  hours: number,
  minutes: number,
  seconds: number
|} | {|
  stepType: 'pause',
  waitForUserInput: true,
  message: string
|}

export type StepItemData = {|
  id: StepIdType,
  title: string,
  stepType: StepType,
  description?: string,
  sourceLabwareName?: string,
  destLabwareName?: string
|}

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
  'aspirate--wells'?: string,
  'aspirate--pipette'?: string,
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
  'dispense--wells'?: string,
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
  'aspirate--wells'?: string,
  'aspirate--pipette'?: string,
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
  'dispense--wells'?: string, // only one well
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

export type TransferFormData = {|
  // TODO Ian 2018-04-05 use "mixin types" like SharedFormDataFields for shared fields across FormData types.
  ...SharedFormDataFields,
  stepType: 'transfer',

  pipette: string, // PipetteId. TODO IMMEDIATELY/SOON make this match in the form

  sourceWells: Array<string>,
  destWells: Array<string>,

  sourceLabware: string,
  destLabware: string,
  /** Volume to aspirate from each source well. Different volumes across the
    source wells isn't currently supported
  */
  volume: number,

  // ===== ASPIRATE SETTINGS =====
  /** Pre-wet tip with ??? uL liquid from the first source well. */
  preWetTip: boolean,
  /** Touch tip after every aspirate */
  touchTipAfterAspirate: boolean,
  /**
    For transfer, changeTip means:
    'always': before each aspirate, get a fresh tip
    'once': get a new tip at the beginning of the transfer step, and use it throughout
    'never': reuse the tip from the last step
  */
  changeTip: ChangeTipOptions,
  /** Mix in first well in chunk */
  mixBeforeAspirate: ?MixArgs,
  /** Disposal volume is added to the volume of the first aspirate of each asp-asp-disp cycle */
  disposalVolume: ?number,

  // ===== DISPENSE SETTINGS =====
  /** Mix in destination well after dispense */
  mixInDestination: ?MixArgs,
  /** Touch tip in destination well after dispense */
  touchTipAfterDispense: boolean,
  /** Number of seconds to delay at the very end of the step (TODO: or after each dispense ?) */
  delayAfterDispense: ?number,
  /** If given, blow out in the specified labware after dispense at the end of each asp-asp-dispense cycle */
  blowout: ?string // TODO LATER LabwareId export type here instead of string?
|}

export type PauseFormData = {|
  stepType: 'pause',
  waitForUserInput: boolean,
  seconds: number, // s/m/h only needed by substep...
  minutes: number,
  hours: number,
  totalSeconds: number,
  message: string
|}

// TODO gradually create & use definitions from step-generation/types.js
export type ProcessedFormData = TransferFormData | PauseFormData | ConsolidateFormData
