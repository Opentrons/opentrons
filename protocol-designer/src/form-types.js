// @flow
import {
  PAUSE_UNTIL_RESUME,
  PAUSE_UNTIL_TIME,
  PAUSE_UNTIL_TEMP,
} from './constants'
import type { IconName } from '@opentrons/components'
import type { LabwareEntity, PipetteEntity } from './step-forms'
import type { ChangeTipOptions } from './step-generation'

export type StepIdType = string

export type StepFieldName = any
// | 'aspirate_airGap_checkbox'
// | 'aspirate_airGap_volume'
// | 'aspirate_changeTip'
// | 'aspirate_flowRate'
// | 'aspirate_labware'
// | 'aspirate_mix_checkbox'
// | 'aspirate_mix_times'
// | 'aspirate_mix_volume'
// | 'aspirate_touchTip_checkbox'
// | 'aspirate_touchTip_mmFromBottom'
// | 'aspirate_mmFromBottom'
// | 'aspirate_wellOrder_first'
// | 'aspirate_wellOrder_second'
// | 'aspirate_wells'
// | 'aspirate_wells_grouped'
// | 'blowout_checkbox'
// | 'blowout_location'
// | 'changeTip'
// | 'dispense_flowRate'
// | 'dispense_labware'
// | 'dispense_touchTip_checkbox'
// | 'dispense_mix_checkbox'
// | 'dispense_mix_times'
// | 'dispense_mix_volume'
// | 'dispense_touchTip_mmFromBottom'
// | 'dispense_mmFromBottom'
// | 'dispense_wellOrder_first'
// | 'dispense_wellOrder_second'
// | 'dispense_wells'
// | 'disposalVolume_checkbox',
// | 'disposalVolume_volume',
// | 'labware'
// | 'labwareLocationUpdate'
// | 'mix_mmFromBottom'
// | 'mix_touchTip_mmFromBottom'
// | 'mix_aspirate_delay_mmFromBottom
// | 'mix_dispense_delay_mmFromBottom
// | 'path'
// | 'pauseAction'
// | 'pauseHour'
// | 'pauseMessage'
// | 'pauseMinute'
// | 'pauseSecond'
// | 'preWetTip'
// | 'pipette'
// | 'stepDetails'
// | 'stepName'
// | 'times'
// | 'touchTip'
// | 'volume'
// | 'wells'
// // deck setup form fields
// | 'labwareLocationUpdate'
// | 'pipetteLocationUpdate'
// // TODO: Ian 2019-01-17 below are DEPRECATED remove in #2916 (make sure to account for this in migration #2917)
// | 'aspirate_preWetTip'
// | 'aspirate_touchTip'
// | 'dispense_blowout_checkbox'
// | 'dispense_blowout_location'
// | 'dispense_touchTip'
// | 'aspirate_disposalVol_checkbox'
// | 'aspirate_disposalVol_volume'

// TODO Ian 2019-01-16 factor out to some constants.js ? See #2926
export const stepIconsByType: { [string]: IconName } = {
  moveLiquid: 'ot-transfer',
  mix: 'ot-mix',
  pause: 'pause',
  manualIntervention: 'pause', // TODO Ian 2018-12-13 pause icon for this is a placeholder
  magnet: 'ot-magnet',
  temperature: 'ot-temperature',
  thermocycler: 'ot-thermocycler',
}

export type StepType = $Keys<typeof stepIconsByType>

// ===== Unprocessed form types =====

export type AnnotationFields = {|
  stepName: string,
  stepDetails: string,
|}

export type BlowoutFields = {|
  blowout_checkbox?: boolean,
  blowout_location?: string,
|}

export type ChangeTipFields = {|
  changeTip?: ChangeTipOptions,
|}

export type MixForm = {|
  ...AnnotationFields,
  ...BlowoutFields,
  ...ChangeTipFields,
  stepType: 'mix',
  id: StepIdType,

  labware?: string,
  pipette?: string,
  times?: string,
  volume?: string,
  wells?: Array<string>,
  touchTip?: boolean,
|}

export type PauseForm = {|
  ...AnnotationFields,
  stepType: 'pause',
  id: StepIdType,

  pauseAction?:
    | typeof PAUSE_UNTIL_RESUME
    | typeof PAUSE_UNTIL_TIME
    | typeof PAUSE_UNTIL_TEMP,

  pauseHour?: string,
  pauseMinute?: string,
  pauseSecond?: string,
  pauseMessage?: string,
  pauseTemperature?: string,
|}

// TODO: separate field values from from metadata
export type FormData = {
  stepType: StepType,
  id: StepIdType,
  [StepFieldName]: any, // TODO: form value processing to ensure type
}

export const PROFILE_CYCLE: 'profileCycle' = 'profileCycle'
export const PROFILE_STEP: 'profileStep' = 'profileStep'

export type ProfileStepItem = {|
  type: typeof PROFILE_STEP,
  id: string,
  title: string,
  temperature: string,
  durationMinutes: string,
  durationSeconds: string,
|}

export type ProfileCycleItem = {|
  type: typeof PROFILE_CYCLE,
  id: string,
  steps: Array<ProfileStepItem>,
  repetitions: string,
|}

// TODO IMMEDIATELY: ProfileStepItem -> ProfileStep, ProfileCycleItem -> ProfileCycle
export type ProfileItem = ProfileStepItem | ProfileCycleItem

export type PathOption = 'single' | 'multiAspirate' | 'multiDispense'

export type WellOrderOption = 'l2r' | 'r2l' | 't2b' | 'b2t'

export type BlankForm = {
  ...AnnotationFields,
  stepType: StepType,
  id: StepIdType,
}

// TODO: Ian 2019-01-15 these types are a placeholder. Should be used in form hydration.
// TODO: this is the type we are aiming for

export type HydratedMoveLiquidFormData = {
  id: string,
  stepType: 'moveLiquid',
  stepName: string,
  description: ?string,

  fields: {
    pipette: PipetteEntity,
    volume: number,
    path: PathOption,
    changeTip: ChangeTipOptions,
    aspirate_wells_grouped: ?boolean,
    preWetTip: ?boolean,

    aspirate_labware: LabwareEntity,
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
    aspirate_airGap_checkbox: ?boolean,
    aspirate_airGap_volume: ?number,

    aspirate_delay_checkbox: boolean,
    aspirate_delay_seconds: ?number,
    aspirate_delay_mmFromBottom: ?number,

    dispense_delay_checkbox: boolean,
    dispense_delay_seconds: ?number,
    dispense_delay_mmFromBottom: ?number,

    dispense_labware: LabwareEntity,
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

export type HydratedMixFormDataLegacy = {
  id: string,
  stepType: 'mix',
  stepName: string,
  stepDetails: ?string,

  pipette: PipetteEntity,
  volume: number,
  changeTip: ChangeTipOptions,

  labware: LabwareEntity,
  wells: Array<string>,
  mix_wellOrder_first: WellOrderOption,
  mix_wellOrder_second: WellOrderOption,
  aspirate_flowRate: ?number,
  mix_mmFromBottom: ?number,
  mix_touchTip_checkbox: ?boolean,
  mix_touchTip_mmFromBottom: ?number,
  times: ?number,

  dispense_flowRate: ?number,

  blowout_checkbox: ?boolean,
  blowout_location: ?string, // labwareId or 'SOURCE_WELL' or 'DEST_WELL'
}

export type MagnetAction = 'engage' | 'disengage'

export type HydratedMagnetFormData = {|
  ...AnnotationFields,
  id: string,
  stepType: 'magnet',
  stepDetails: string | null,
  moduleId: string | null,
  magnetAction: MagnetAction,
  engageHeight: string | null,
|}

export type HydratedTemperatureFormData = {|
  id: string,
  stepType: 'temperature',
  stepDetails: string | null,
  moduleId: string | null,
  setTemperature: 'true' | 'false',
  targetTemperature: string | null,
|}

// TODO: Ian 2019-01-17 Moving away from this and towards nesting all form fields
// inside `fields` key, but deprecating transfer/consolidate/distribute is a pre-req
export type HydratedMoveLiquidFormDataLegacy = {
  ...AnnotationFields,
  id: string,
  stepType: 'moveLiquid',
  ...$Exact<$PropertyType<HydratedMoveLiquidFormData, 'fields'>>,
}

// fields used in TipPositionInput
export type TipOffsetFields =
  | 'aspirate_mmFromBottom'
  | 'dispense_mmFromBottom'
  | 'mix_mmFromBottom'
  | 'aspirate_touchTip_mmFromBottom'
  | 'dispense_touchTip_mmFromBottom'
  | 'aspirate_delay_mmFromBottom'
  | 'dispense_delay_mmFromBottom'
  | 'mix_touchTip_mmFromBottom'
  | 'mix_aspirate_delay_mmFromBottom'
  | 'mix_dispense_delay_mmFromBottom'

export type DelayCheckboxFields =
  | 'aspirate_delay_checkbox'
  | 'dispense_delay_checkbox'

export type DelaySecondFields =
  | 'aspirate_delay_seconds'
  | 'dispense_delay_seconds'

export function getIsTouchTipField(fieldName: string): boolean {
  const touchTipFields = [
    'aspirate_touchTip_mmFromBottom',
    'dispense_touchTip_mmFromBottom',
    'mix_touchTip_mmFromBottom',
    'mix_aspirate_delay_mmFromBottom',
    'mix_dispense_delay_mmFromBottom',
  ]
  return touchTipFields.includes(fieldName)
}

export function getIsDelayPositionField(fieldName: string): boolean {
  const delayPositionFields = [
    'aspirate_delay_mmFromBottom',
    'dispense_delay_mmFromBottom',
  ]
  return delayPositionFields.includes(fieldName)
}
