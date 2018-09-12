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
}

export type StepType = $Keys<typeof stepIconsByType>

// ===== Unprocessed form types =====

export type FormModalFields = {|
  'step-name': string,
  'step-details': string,
|}

export type DelayFields = {|
  'dispense_delay_checkbox'?: boolean,
  'dispense_delayMinutes'?: string,
  'dispense_delaySeconds'?: string,
|}

export type BlowoutFields = {|
  'dispense_blowout_checkbox'?: boolean,
  'dispense_blowout_labware'?: string,
|}

export type ChangeTipFields = {|
  'aspirate_changeTip'?: ChangeTipOptions,
|}

export type TouchTipFields = {|
  'aspirate_touchTip'?: boolean,
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

  'aspirate_labware'?: string,
  'aspirate_wells'?: Array<string>,
  'pipette'?: string,
  'aspirate_preWetTip'?: boolean,
  'aspirate_airGap_checkbox'?: boolean,
  'aspirate_airGap_volume'?: string,
  'aspirate_mix_checkbox'?: boolean,
  'aspirate_mix_volume'?: string,
  'aspirate_mix_times'?: string,
  'aspirate_disposalVol_checkbox'?: boolean,
  'aspirate_disposalVol_volume'?: string,

  'volume'?: string,
  'dispense_labware'?: string,
  'dispense_wells'?: Array<string>,
  'dispense_touchTip'?: boolean,
  'dispense_mix_checkbox'?: boolean,
  'dispense_mix_volume'?: string,
  'dispense_mix_times'?: string,
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
  'touch-tip'?: boolean,
|}

export type PauseForm = {|
  ...FormModalFields,
  stepType: 'pause',
  id: StepIdType,

  'pauseForAmountOfTime'?: 'true' | 'false',
  'pauseHour'?: string,
  'pauseMinute'?: string,
  'pauseSecond'?: string,
  'pauseMessage'?: string,
|}

// TODO: separate field values from from metadata
export type FormData = {
  stepType: StepType,
  id: StepIdType,
  'step-name'?: string,
  'step-details'?: string,
  [StepFieldName]: any, // TODO: form value processing to ensure type
}
//  | MixForm
//  | PauseForm
//  | TransferLikeForm

export type BlankForm = {
  ...FormModalFields,
  stepType: StepType,
  id: StepIdType,
}
