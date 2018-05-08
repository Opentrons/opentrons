// @flow
import type {IconName} from '@opentrons/components'
import type {
  ChangeTipOptions,
  ConsolidateFormData,
  TransferFormData,
  PauseFormData
} from './step-generation'

export type StepIdType = number

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

export type TransferLikeStepType = 'transfer' | 'consolidate' | 'distribute'

export type TransferLikeForm = {|
  ...FormModalFields,
  stepType: TransferLikeStepType,
  id: StepIdType,

  'aspirate--labware'?: string,
  'aspirate--wells'?: Array<string>,
  'pipette'?: string,
  'aspirate--pre-wet-tip'?: boolean,
  'aspirate--touch-tip'?: boolean,
  'aspirate--air-gap--checkbox'?: boolean,
  'aspirate--air-gap--volume'?: string,
  'aspirate--mix--checkbox'?: boolean,
  'aspirate--mix--volume'?: string,
  'aspirate--mix--times'?: string,
  'aspirate--disposal-vol--checkbox'?: boolean,
  'aspirate--disposal-vol--volume'?: string,
  'aspirate--change-tip'?: ChangeTipOptions,

  'volume'?: string,
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

export type FormData = TransferLikeForm | PauseForm

export type BlankForm = {
  ...FormModalFields,
  stepType: StepType,
  id: StepIdType
}

// TODO gradually create & use definitions from step-generation/types.js
export type ProcessedFormData = TransferFormData | PauseFormData | ConsolidateFormData
