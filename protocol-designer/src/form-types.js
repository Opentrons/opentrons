// @flow
import type {IconName} from '@opentrons/components'
import type {LabwareDefinition, PipetteNameSpecs} from '@opentrons/shared-data'
import type {ChangeTipOptions} from './step-generation'

export type StepIdType = string

export type StepFieldName =
  | 'aspirate_airGap_checkbox'
  | 'aspirate_airGap_volume'
  | 'aspirate_changeTip'
  | 'aspirate_disposalVol_checkbox'
  | 'aspirate_disposalVol_volume'
  | 'aspirate_flowRate'
  | 'aspirate_labware'
  | 'aspirate_mix_checkbox'
  | 'aspirate_mix_times'
  | 'aspirate_mix_volume'
  | 'aspirate_touchTip_checkbox'
  | 'aspirate_touchTipMmFromBottom'
  | 'aspirate_mmFromBottom'
  | 'aspirate_wellOrder_first'
  | 'aspirate_wellOrder_second'
  | 'aspirate_wells'
  | 'aspirate_wells_grouped'
  | 'blowout_checkbox'
  | 'blowout_location'
  | 'changeTip'
  | 'dispense_flowRate'
  | 'dispense_labware'
  | 'dispense_touchTip_checkbox'
  | 'dispense_mix_checkbox'
  | 'dispense_mix_times'
  | 'dispense_mix_volume'
  | 'dispense_touchTipMmFromBottom'
  | 'dispense_mmFromBottom'
  | 'dispense_wellOrder_first'
  | 'dispense_wellOrder_second'
  | 'dispense_wells'
  | 'labware'
  | 'labwareLocationUpdate'
  | 'mix_mmFromBottom'
  | 'mix_touchTipMmFromBottom'
  | 'path'
  | 'pauseForAmountOfTime'
  | 'pauseHour'
  | 'pauseMessage'
  | 'pauseMinute'
  | 'pauseSecond'
  | 'preWetTip'
  | 'pipette'
  | 'stepDetails'
  | 'stepName'
  | 'times'
  | 'touchTip'
  | 'volume'
  | 'wells'
  // deck setup form fields
  | 'labwareLocationUpdate'
  | 'pipetteLocationUpdate'
  // TODO: Ian 2019-01-17 below are DEPRECATED remove in #2916 (make sure to account for this in migration #2917)
  | 'aspirate_preWetTip'
  | 'aspirate_touchTip'
  | 'dispense_blowout_checkbox'
  | 'dispense_blowout_location'
  | 'dispense_touchTip'

// TODO Ian 2019-01-16 factor out to some constants.js ? See #2926
export const stepIconsByType: {[string]: IconName} = {
  'transfer': 'ot-transfer',
  'distribute': 'ot-distribute',
  'consolidate': 'ot-consolidate',
  'mix': 'ot-mix',
  'pause': 'pause',
  'manualIntervention': 'pause', // TODO Ian 2018-12-13 pause icon for this is a placeholder
  'moveLiquid': 'ot-transfer',
}

export type StepType = $Keys<typeof stepIconsByType>

// ===== Unprocessed form types =====

export type AnnotationFields = {|
  'stepName': string,
  'stepDetails': string,
|}

export type BlowoutFields = {|
  'dispense_blowout_checkbox'?: boolean,
  'dispense_blowout_location'?: string,
|}

export type ChangeTipFields = {|
  'aspirate_changeTip'?: ChangeTipOptions,
|}

export type TransferLikeStepType = 'transfer' | 'consolidate' | 'distribute'

export type TransferLikeForm = {|
  ...AnnotationFields,
  ...BlowoutFields,
  ...ChangeTipFields,

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
  ...AnnotationFields,
  ...BlowoutFields,
  ...ChangeTipFields,
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
  ...AnnotationFields,
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
  [StepFieldName]: any, // TODO: form value processing to ensure type
}
//  | MixForm
//  | PauseForm
//  | TransferLikeForm

export type PathOption = 'single' | 'multiAspirate' | 'multiDispense'

export type WellOrderOption = 'l2r' | 'r2l' | 't2b' | 'b2t'

export type BlankForm = {
  ...AnnotationFields,
  stepType: StepType,
  id: StepIdType,
}

// TODO: Ian 2019-01-15 these HydratedLabware / HydratedPipette types are a placeholder. Should be used in form hydration.
type HydratedLabware = {id: string, type: string, def: LabwareDefinition}
type HydratedPipette = {id: string, model: string, spec: PipetteNameSpecs}
// TODO: this is the type we are aiming for

export type HydratedMoveLiquidFormData = {
  id: string,
  stepType: 'moveLiquid',
  stepName: string,
  description: ?string,

  fields: {
    pipette: HydratedPipette,
    volume: number,
    path: PathOption,
    changeTip: ChangeTipOptions,
    aspirate_wells_grouped: ?boolean,
    preWetTip: ?boolean,

    aspirate_labware: HydratedLabware,
    aspirate_wells: Array<string>,
    aspirate_wellOrder_first: WellOrderOption,
    aspirate_wellOrder_second: WellOrderOption,
    aspirate_flowRate: ?number,
    aspirate_mmFromBottom: ?number,
    aspirate_touchTip_checkbox: ?boolean,
    aspirate_touchTip_mmFromBottom: ?number,
    aspirate_mix_checkbox: ?boolean,
    aspirate_mix_volume: ?number,
    aspirate_mix_times: ?number,

    dispense_labware: HydratedLabware,
    dispense_wells: Array<string>,
    dispense_wellOrder_first: WellOrderOption,
    dispense_wellOrder_second: WellOrderOption,
    dispense_flowRate: ?number,
    dispense_mmFromBottom: ?number,
    dispense_touchTip_checkbox: ?boolean,
    dispense_touchTip_mmFromBottom: ?number,
    dispense_mix_checkbox: ?boolean,
    dispense_mix_volume: ?number,
    dispense_mix_times: ?number,

    disposalVolume_checkbox: ?boolean,
    disposalVolume_volume: ?number,
    blowout_checkbox: ?boolean,
    blowout_location: ?string, // labwareId or 'SOURCE_WELL' or 'DEST_WELL'
  },
}

// TODO: Ian 2019-01-17 Moving away from this and towards nesting all form fields
// inside `fields` key, but deprecating transfer/consolidate/distribute is a pre-req
export type HydratedMoveLiquidFormDataLegacy = {
  ...AnnotationFields,
  id: string,
  stepType: 'moveLiquid',
  ...$Exact<$PropertyType<HydratedMoveLiquidFormData, 'fields'>>,
}

// fields used in TipPositionInput
export type TipOffsetFields = 'aspirate_mmFromBottom'
  | 'dispense_mmFromBottom'
  | 'mix_mmFromBottom'
  | 'aspirate_touchTipMmFromBottom'
  | 'dispense_touchTipMmFromBottom'
  | 'mix_touchTipMmFromBottom'

export function getIsTouchTipField (fieldName: string): boolean {
  const touchTipFields = [
    'aspirate_touchTipMmFromBottom',
    'dispense_touchTipMmFromBottom',
    'mix_touchTipMmFromBottom',
  ]
  return touchTipFields.includes(fieldName)
}
