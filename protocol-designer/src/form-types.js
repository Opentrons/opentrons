// @flow
import type {IconName} from '@opentrons/components'
import type {ChangeTipOptions} from './step-generation'
import type {StepFieldName} from './steplist/fieldLevel'

export type StepIdType = number // TODO Ian 2018-05-10 change to string

// TODO Ian 2018-01-16 factor out to some constants.js ?
export const stepIconsByType: {[string]: IconName} = {
  'transfer': 'ot-transfer',
  'distribute': 'ot-distribute',
  'consolidate': 'ot-consolidate',
  'mix': 'ot-mix',
  'pause': 'pause',
  'deck-setup': 'flask-outline'
}

export type StepType = $Keys<typeof stepIconsByType>

// ===== Unprocessed form types =====

export type FormModalFields = {|
  'step-name': string,
  'step-details': string
|}

export type DelayFields = {|
  'dispense--delay--checkbox'?: boolean,
  'dispense--delay-minutes'?: string,
  'dispense--delay-seconds'?: string
|}

export type BlowoutFields = {|
  'dispense--blowout--checkbox'?: boolean,
  'dispense--blowout--labware'?: string
|}

export type ChangeTipFields = {|
  'aspirate--change-tip'?: ChangeTipOptions,
|}

export type TouchTipFields = {|
  'aspirate--touch-tip'?: boolean
|}

export type TransferLikeStepType = 'transfer' | 'consolidate' | 'distribute'

export type TransferLikeForm = {|
  ...FormModalFields,
  ...BlowoutFields,
  ...ChangeTipFields,
  ...DelayFields,
  ...TouchTipFields,

  stepType: TransferLikeStepType,
  id: StepIdType,

  'aspirate--labware'?: string,
  'aspirate--wells'?: Array<string>,
  'pipette'?: string,
  'aspirate--pre-wet-tip'?: boolean,
  'aspirate--air-gap--checkbox'?: boolean,
  'aspirate--air-gap--volume'?: string,
  'aspirate--mix--checkbox'?: boolean,
  'aspirate--mix--volume'?: string,
  'aspirate--mix--times'?: string,
  'aspirate--disposal-vol--checkbox'?: boolean,
  'aspirate--disposal-vol--volume'?: string,

  'volume'?: string,
  'dispense--labware'?: string,
  'dispense--wells'?: Array<string>,
  'dispense--mix--checkbox'?: boolean,
  'dispense--mix--volume'?: string,
  'dispense--mix--times'?: string
|}

export type MixForm = {|
  ...FormModalFields,
  ...BlowoutFields,
  ...ChangeTipFields,
  ...DelayFields,
  ...TouchTipFields,
  stepType: 'mix',
  id: StepIdType,

  'labware'?: string,
  'pipette'?: string,
  'times'?: string,
  'volume'?: string,
  'wells'?: Array<string>,
  'touch-tip'?: boolean
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

export type FormData = {
  stepType: StepType,
  id: StepIdType,
  [StepFieldName]: ?mixed | ?string
}
//  | MixForm
//  | PauseForm
//  | TransferLikeForm

export type BlankForm = {
  ...FormModalFields,
  stepType: StepType,
  id: StepIdType
}
