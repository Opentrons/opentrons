// @flow

import type {ConsolidateFormData} from '../step-generation'

// sections of the form that are expandable/collapsible
export type FormSectionState = {aspirate: boolean, dispense: boolean}
export type FormSectionNames = 'aspirate' | 'dispense'

// TODO Ian 2018-01-16 factor out to steplist/constants.js ?
export const stepIconsByType = {
  'transfer': 'arrow right',
  'distribute': 'distribute',
  'consolidate': 'consolidate',
  'mix': 'mix',
  'pause': 'pause',
  'deck-setup': 'flask'
}

export const END_STEP = '__end__' // Special ID of "End" pseudo-step
export type EndStepId = '__end__'

export type StepType = $Keys<typeof stepIconsByType>

export type StepIdType = number

export type TransferishStepItem = {|
  stepType: 'transfer' | 'consolidate' | 'distribute',
  parentStepId: StepIdType,
  rows: Array<{|
    substepId: number, // TODO should this be a string or is this ID properly a number?
    sourceIngredientName?: string,
    destIngredientName?: string,
    sourceWell?: string,
    destWell?: string
  |}>
|}

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
  description?: string
|}

export type SubSteps = {[StepIdType]: StepSubItemData | null}

export type TransferForm = {|
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
  'aspirate--mix--time'?: string,
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
  'aspirate--mix--time'?: string,
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
  stepType: 'pause',
  id: StepIdType,

  'pause-for-amount-of-time'?: 'true' | 'false',
  'pause-hour'?: string,
  'pause-minute'?: string,
  'pause-second'?: string,
  'pause-message'?: string,
|}

export type FormData = TransferForm | ConsolidateForm | PauseForm

export type TransferFormData = {|
  stepType: 'transfer',
  pipette: string, // pipette ID
  sourceWells: Array<string>,
  destWells: Array<string>,
  sourceLabware: string,
  destLabware: string,
  volume: number
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

export type FormModalFields = {
  'step-name': string,
  'step-details': string
}
