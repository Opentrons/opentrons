import type { IconName } from '@opentrons/components'
import type {
  Height,
  LabwareLocation,
  NozzleConfigurationStyle,
  PositionReference,
  PrimaryNozzleConfigurationStyle,
  Width,
} from '@opentrons/shared-data'
import type {
  ChangeTipOptions,
  LabwareEntity,
  PipetteEntity,
  TipRackWithDef,
  TipTrackingOption,
  TrashBinEntity,
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
  VACUUM_PROGRAM_PROFILE,
  VACUUM_PROGRAM_STATE,
  VACUUM_STATE_PUMP_OFF,
  VACUUM_STATE_PUMP_ON,
  VACUUM_VENT_SET_CLOSED,
  VACUUM_VENT_SET_OPEN,
  WasteChuteEntity,
} from '@opentrons/step-generation'
import type {
  ABSORBANCE_READER_INITIALIZE,
  ABSORBANCE_READER_INITIALIZE_MODE_MULTI,
  ABSORBANCE_READER_INITIALIZE_MODE_SINGLE,
  ABSORBANCE_READER_LID,
  ABSORBANCE_READER_READ,
  FLEX_STACKER_EMPTY,
  FLEX_STACKER_FILL,
  FLEX_STACKER_RETRIEVE,
  FLEX_STACKER_STORE,
  PAUSE_UNTIL_RESUME,
  PAUSE_UNTIL_TC_PROFILE_COMPLETE,
  PAUSE_UNTIL_TEMP,
  PAUSE_UNTIL_TIME,
  PAUSE_UNTIL_VACUUM_PROFILE_COMPLETE,
  PAUSE_UNTIL_VACUUM_STATE_COMPLETE,
} from './constants'

export type StepIdType = string
export type StepFieldName = string

/* PIPETTING AND GRIPPER FIELDS */
// | 'aspirate_airGap_checkbox'
// | 'aspirate_airGap_volume'
// | 'aspirate_changeTip'
// | 'aspirate_flowRate'
// | 'aspirate_labware'
// | 'aspirate_mix_checkbox'
// | 'aspirate_mix_times'
// | 'aspirate_mix_volume'
// | 'aspirate_mmFromBottom'
// | 'aspirate_retract_delay_seconds'
// | 'aspirate_retract_mmFromBottom'
// | 'aspirate_retract_speed'
// | 'aspirate_retract_x_position'
// | 'aspirate_retract_y_position'
// | 'aspirate_submerge_delay_seconds'
// | 'aspirate_submerge_speed'
// | 'aspirate_touchTip_checkbox'
// | 'aspirate_touchTip_mmFromTop'
// | 'aspirate_wellOrder_first'
// | 'aspirate_wellOrder_second'
// | 'aspirate_wells_grouped'
// | 'aspirate_wells'
// | 'aspirate_x_position
// | 'aspirate_y_position
// | 'blowout_checkbox'
// | 'blowout_flowRate'
// | 'blowout_location'
// | 'blowout_z_offset'
// | 'changeTip'
// | 'dispense_flowRate'
// | 'dispense_labware'
// | 'dispense_mix_checkbox'
// | 'dispense_mix_times'
// | 'dispense_mix_volume'
// | 'dispense_mmFromBottom'
// | 'dispense_retract_delay_seconds'
// | 'dispense_retract_mmFromBottom'
// | 'dispense_retract_speed'
// | 'dispense_retract_x_position'
// | 'dispense_retract_y_position'
// | 'dispense_submerge_delay_seconds'
// | 'dispense_submerge_speed'
// | 'dispense_touchTip_checkbox'
// | 'dispense_touchTip_mmFromTop'
// | 'dispense_wellOrder_first'
// | 'dispense_wellOrder_second'
// | 'dispense_wells'
// | 'dispense_x_position
// | 'dispense_y_position
// | 'disposalVolume_checkbox',
// | 'disposalVolume_volume',
// | 'dropTip_location'
// | 'dropTip_location'
// | 'labware'
// | 'labwareLocationUpdate'
// | 'message'
// | 'mix_mmFromBottom'
// | 'mix_touchTip_mmFromTop'
// | 'mix_x_position
// | 'mix_y_position
// | 'newLocation'
// | 'nozzles'
// | 'path'
// | 'pauseAction'
// | 'pauseHour'
// | 'pauseMessage'
// | 'pauseMinute'
// | 'pauseSecond'
// | 'pickUpTip_location'
// | 'pickUpTip_wellNames'
// | 'pipette'
// | 'preWetTip'
// | 'stepDetails'
// | 'stepName'
// | 'times'
// | 'tipRack'
// | 'touchTip'
// | 'useGripper'
// | 'volume'
// | 'wells'

/* MODULE FIELDS */
// | 'blockIsActive'
// | 'engageHeight'
// | 'heaterShakerSetTimer'
// | 'heaterShakerTimerMinutes'
// | 'heaterShakerTimerSeconds'
// | 'latchOpen'
// | 'lidIsActive'
// | 'lidOpen'
// | 'lidTargetTemp'
// | 'magnetAction'
// | 'moduleId'
// | 'orderedProfileItems'
// | 'profileItemsById'
// | 'profileTargetLidTemp'
// | 'profileVolume'
// | 'setHeaterShakerTemperature'
// | 'setShake'
// | 'setTemperature'
// | 'targetHeaterShakerTemperature'
// | 'targetSpeed'
// | 'targetTemperature'
// | 'thermocyclerFormType'

/* COMMENT FIELD */
// | message

/* DECK SETUP FIELDS */
// | 'labwareLocationUpdate'
// | 'moduleLocationUpdate'
// | 'pipetteLocationUpdate'

// // TODO: Ian 2019-01-17 below are DEPRECATED remove in #2916 (make sure to account for this in migration #2917)
// | 'aspirate_disposalVol_checkbox'
// | 'aspirate_disposalVol_volume'
// | 'aspirate_preWetTip'
// | 'aspirate_touchTip'
// | 'dispense_blowout_checkbox'
// | 'dispense_blowout_location'
// | 'dispense_touchTip'

// TODO Ian 2019-01-16 factor out to some constants.js ? See #2926
export type StepType =
  | 'absorbanceReader'
  | 'camera'
  | 'comment'
  | 'flexStacker'
  | 'heaterShaker'
  | 'magnet'
  | 'manualIntervention'
  | 'mix'
  | 'moveLabware'
  | 'moveLiquid'
  | 'pause'
  | 'temperature'
  | 'thermocycler'
  | 'flexStacker'
  | 'vacuum'
export const stepIconsByType: Record<StepType, IconName> = {
  absorbanceReader: 'ot-absorbance',
  camera: 'camera',
  comment: 'comment',
  flexStacker: 'ot-flex-stacker',
  heaterShaker: 'ot-heater-shaker',
  magnet: 'ot-magnet-v2',
  manualIntervention: 'pause-circle',
  mix: 'mix',
  moveLabware: 'ot-move',
  moveLiquid: 'transfer',
  pause: 'pause-circle',
  temperature: 'ot-temperature-v2',
  thermocycler: 'ot-thermocycler',
  vacuum: 'ot-vacuum',
}
// ===== Unprocessed form types =====
export interface AnnotationFields {
  // todo(mm, 2026-01-06):
  //
  // FormData does not extend from this type, but we do have code that tries to access
  // stepName and stepDetails on FormData. (This has not been an error because FormData
  // is essentially any-typed).
  //
  // Meanwhile, stepNumber seems to be hard-coded to 0 in new protocols, missing in
  // old migrated protocols, and always overwritten with the actual index in
  // getArgsAndErrorsByStepId() by the time we pass it to step-generation.
  //
  // We probably want to:
  // - Make FormData extend from this type (to reflect the fact that code expects stepName and stepDetails on it)
  // - Make stepNumber optional (to reflect the fact that it may or may not be present in imported files)
  // - Deprecate stepNumber (to reflect the fact that it's overwritten and doesn't matter)
  stepName: string
  stepDetails: string
  stepNumber: number
}
export interface BlowoutFields {
  blowout_checkbox?: boolean
  blowout_location?: string
}
export interface ChangeTipFields {
  changeTip?: ChangeTipOptions
}
export type HydratedPauseFormData = AnnotationFields & {
  stepType: 'pause'
  id: StepIdType
  pauseAction?:
    | typeof PAUSE_UNTIL_RESUME
    | typeof PAUSE_UNTIL_TIME
    | typeof PAUSE_UNTIL_TEMP
    | typeof PAUSE_UNTIL_TC_PROFILE_COMPLETE
    | typeof PAUSE_UNTIL_VACUUM_PROFILE_COMPLETE
    | typeof PAUSE_UNTIL_VACUUM_STATE_COMPLETE
  pauseMessage?: string
  /** If `PAUSE_UNTIL_TEMP`, the temperature to wait for. */
  pauseTemperature?: string
  /** If `PAUSE_UNTIL_TIME`, how long to wait. */
  pauseTime?: string
  /** If `PAUSE_UNTIL_TEMP` or `PAUSE_UNTIL_TC_PROFILE_COMPLETE`, the module to wait for. */
  moduleId?: string
}
export interface FormData {
  stepType: StepType
  id: StepIdType
  [key: string]: any
}
export const PROFILE_CYCLE: 'profileCycle' = 'profileCycle'
export const PROFILE_STEP: 'profileStep' = 'profileStep'
interface ProfileStepItemBase {
  type: typeof PROFILE_STEP
  id: string
  title: string
}

// Thermocycler
// TODO: Rename plain "ProfileX" to "ThermocyclerProfileX"
export interface ProfileStepItem extends ProfileStepItemBase {
  temperature: string
  durationMinutes: string
  durationSeconds: string
}

interface ProfileCycleItemBase {
  type: typeof PROFILE_CYCLE
  id: string
  repetitions: string
}
interface ProfileCycleItem extends ProfileCycleItemBase {
  steps: ProfileStepItem[]
}

export type ProfileItem = ProfileStepItem | ProfileCycleItem

// Vacuum
export interface VacuumPressureData {
  mode: typeof VACUUM_MODE_PRESSURE
  pressureMbar: string | null
}

export interface VacuumPowerData {
  mode: typeof VACUUM_MODE_POWER
  percentPower: number
}

type VacuumPumpData = VacuumPressureData | VacuumPowerData

export interface VacuumProfileStep extends ProfileStepItemBase {
  time: string
  pumpData: VacuumPumpData
  ventAfter: boolean
}

export interface VacuumProfileCycle extends ProfileCycleItemBase {
  profileStepItemsById: Record<string, VacuumProfileStep>
  orderedProfileStepIds: string[]
}
export type VacuumProfileItem = VacuumProfileStep | VacuumProfileCycle

export type PathOption = 'single' | 'multiAspirate' | 'multiDispense'
export type WellOrderOption = 'l2r' | 'r2l' | 't2b' | 'b2t'
export type BlankForm = AnnotationFields & {
  stepType: StepType
  id: StepIdType
}

export interface LabwareEntityWithTouchTip extends LabwareEntity {
  isTouchTipAllowed: boolean
}

interface WasteChuteEntityWithTouchTip extends WasteChuteEntity {
  isTouchTipAllowed: boolean
  name: 'wasteChute'
}

interface TrashBinEntityWithTouchTip extends TrashBinEntity {
  isTouchTipAllowed: boolean
  name: 'trashBin'
}

export type LabwareOrAdditionalEquipmentEntity =
  | LabwareEntityWithTouchTip
  | WasteChuteEntityWithTouchTip
  | TrashBinEntityWithTouchTip

export interface HydratedMoveLiquidFormData extends AnnotationFields {
  id: string
  stepType: 'moveLiquid'
  aspirate_airGap_checkbox: boolean
  aspirate_delay_checkbox: boolean
  aspirate_labware: LabwareEntity
  aspirate_mix_checkbox: boolean
  aspirate_touchTip_checkbox: boolean
  aspirate_wellOrder_first: WellOrderOption
  aspirate_wellOrder_second: WellOrderOption
  aspirate_wells: string[]
  blowout_checkbox: boolean
  changeTip: ChangeTipOptions
  dispense_airGap_checkbox: boolean
  dispense_delay_checkbox: boolean
  dispense_labware: LabwareOrAdditionalEquipmentEntity
  dispense_mix_checkbox: boolean
  dispense_touchTip_checkbox: boolean
  dispense_wellOrder_first: WellOrderOption
  dispense_wellOrder_second: WellOrderOption
  dispense_wells: string[]
  disposalVolume_checkbox: boolean
  dropTip_location: string
  liquidClassesSupported: boolean
  nozzles: NozzleConfigurationStyle
  path: PathOption
  // the existing code claims that pipette and tipRack are not nullable, but they are:
  pipette: PipetteEntity
  primaryNozzle: PrimaryNozzleConfigurationStyle

  tipRack: TipRackWithDef
  volume: number
  pushOut_volume: number | null
  pushOut_checkbox: boolean
  aspirate_airGap_volume?: string | null
  aspirate_delay_seconds?: number | null
  aspirate_flowRate?: number | null
  aspirate_mix_times?: number | null
  aspirate_mix_volume?: number | null
  aspirate_mmFromBottom?: number | null
  aspirate_retract_delay_seconds?: number | null
  aspirate_retract_mmFromBottom?: number | null
  aspirate_retract_speed?: number | null
  aspirate_retract_x_position?: number | null
  aspirate_retract_y_position?: number | null
  aspirate_retract_position_reference: PositionReference
  aspirate_submerge_delay_seconds?: number | null
  aspirate_submerge_speed?: number | null
  aspirate_submerge_mmFromBottom: number | null
  aspirate_submerge_x_position: number | null
  aspirate_submerge_y_position: number | null
  aspirate_submerge_position_reference: PositionReference
  aspirate_touchTip_mmFromEdge?: number | null
  aspirate_touchTip_mmFromTop?: number | null
  aspirate_touchTip_speed?: number | null
  aspirate_wells_grouped?: boolean | null
  aspirate_x_position?: number | null
  aspirate_y_position?: number | null
  aspirate_position_reference: PositionReference
  blowout_flowRate?: number | null
  blowout_location?: string | null
  blowout_mmFromBottom?: number | null
  blowout_x_position?: number | null
  blowout_y_position?: number | null
  blowout_position_reference?: string | null
  conditioning_checkbox: boolean | null
  conditioning_volume: number | null
  dispense_airGap_volume?: string | null
  dispense_delay_seconds?: number | null
  dispense_flowRate?: number | null
  dispense_mix_times?: number | null
  dispense_mix_volume?: number | null
  dispense_mmFromBottom?: number | null
  dispense_retract_delay_seconds?: number | null
  dispense_retract_mmFromBottom?: number | null
  dispense_retract_speed?: number | null
  dispense_retract_x_position?: number | null
  dispense_retract_y_position?: number | null
  dispense_retract_position_reference: PositionReference
  dispense_submerge_delay_seconds?: number | null
  dispense_submerge_speed?: number | null
  dispense_submerge_mmFromBottom: number | null
  dispense_submerge_x_position: number | null
  dispense_submerge_y_position: number | null
  dispense_submerge_position_reference: PositionReference
  dispense_touchTip_mmFromEdge?: number | null
  dispense_touchTip_mmFromTop?: number | null
  dispense_touchTip_speed?: number | null
  dispense_x_position?: number | null
  dispense_y_position?: number | null
  dispense_position_reference: PositionReference
  disposalVolume_volume?: string | null
  dropTip_wellNames?: string[] | null
  pickUpTip_location?: string | null
  pickUpTip_wellNames?: string[] | null
  preWetTip?: boolean | null
  liquidClass?: string | null // a liquid class name like "water" or "none" or null
  tips_selected?: string[][] | null
  tip_tracking?: TipTrackingOption | null
  tiprack_selected?: string | null
}

export interface HydratedMoveLabwareFormData extends AnnotationFields {
  id: string
  stepType: 'moveLabware'
  labware: LabwareEntity
  newLocation: LabwareLocation
  useGripper: boolean
}

export interface HydratedCommentFormData extends AnnotationFields {
  id: string
  stepType: 'comment'
  message: string
}

export interface HydratedCameraFormData extends AnnotationFields {
  id: string
  stepType: 'camera'
  homeBefore: boolean
  fileName: string
  resolution: [Width, Height]
  zoom: number
  contrast: number
  brightness: number
  saturation: number
}

export interface HydratedMixFormData extends AnnotationFields {
  aspirate_delay_checkbox: boolean
  blowout_checkbox: boolean
  changeTip: ChangeTipOptions
  dispense_delay_checkbox: boolean
  dropTip_location: string
  id: string
  labware: LabwareEntityWithTouchTip
  liquidClassesSupported: boolean
  mix_touchTip_checkbox: boolean
  mix_wellOrder_first: WellOrderOption
  mix_wellOrder_second: WellOrderOption
  nozzles: NozzleConfigurationStyle
  pipette: PipetteEntity // can be null if user deletes pipette
  stepType: 'mix'
  tipRack: TipRackWithDef
  volume: number
  wells: string[]
  aspirate_delay_seconds?: number | null
  aspirate_flowRate?: number | null
  blowout_flowRate?: number | null
  blowout_location?: string | null
  blowout_z_offset?: number | null
  dispense_delay_seconds?: number | null
  dispense_flowRate?: number | null
  dropTip_wellNames?: string[] | null
  // TODO: mix_mmFromBottom is now the position above the mix_position_reference, not the bottom.
  // Renaming it will probably require a migration.
  mix_mmFromBottom?: number | null
  mix_touchTip_mmFromTop?: number | null
  mix_x_position?: number | null
  mix_y_position?: number | null
  mix_position_reference: PositionReference
  pickUpTip_location?: string | null
  pickUpTip_wellNames?: string[] | null
  primaryNozzle: PrimaryNozzleConfigurationStyle
  pushOut_volume: number | null
  pushOut_checkbox: boolean
  times?: number | null
  liquidClass?: string | null
  tips_selected?: string[][] | null
  tip_tracking?: TipTrackingOption | null
  tiprack_selected?: string | null
}
export type MagnetAction = 'engage' | 'disengage'
export type HydratedMagnetFormData = AnnotationFields & {
  engageHeight: string | null
  id: string
  magnetAction: MagnetAction
  moduleId: string
  stepDetails: string | null
  stepType: 'magnet'
}
export interface HydratedTemperatureFormData extends AnnotationFields {
  id: string
  moduleId: string | null
  setTemperature: 'true' | 'false'
  stepType: 'temperature'
  targetTemperature: string | null
}
export interface HydratedHeaterShakerFormData extends AnnotationFields {
  heaterShakerSetTimer: boolean | null
  heaterShakerTimer: string | null
  id: string
  latchOpen: boolean
  moduleId: string
  setHeaterShakerTemperature: boolean
  setShake: boolean
  stepType: 'heaterShaker'
  targetHeaterShakerTemperature: string | null
  targetSpeed: string | null
}

export interface HydratedThermocyclerFormData extends AnnotationFields {
  id: string
  stepType: 'thermocycler'

  moduleId: string

  thermocyclerFormType: 'thermocyclerState' | 'thermocyclerProfile'

  blockIsActive: boolean
  blockTargetTemp: string | null

  lidIsActive: boolean
  lidTargetTemp: string | null

  lidOpen: boolean

  orderedProfileItems: string[]
  profileItemsById: Record<string, ProfileItem>
  profileTargetLidTemp: string | null
  profileVolume: string | null
}

export type AbsorbanceReaderFormType =
  | typeof ABSORBANCE_READER_INITIALIZE
  | typeof ABSORBANCE_READER_READ
  | typeof ABSORBANCE_READER_LID

export interface HydratedAbsorbanceReaderFormData extends AnnotationFields {
  stepType: 'absorbanceReader'
  id: string
  absorbanceReaderFormType: AbsorbanceReaderFormType | null
  fileName: string | null
  lidOpen: boolean | null
  mode:
    | typeof ABSORBANCE_READER_INITIALIZE_MODE_MULTI
    | typeof ABSORBANCE_READER_INITIALIZE_MODE_SINGLE
  moduleId: string
  referenceWavelength: string | null
  referenceWavelengthActive: boolean
  wavelengths: string[]
}

export type FlexStackerFormType =
  | typeof FLEX_STACKER_RETRIEVE
  | typeof FLEX_STACKER_STORE
  | typeof FLEX_STACKER_FILL
  | typeof FLEX_STACKER_EMPTY

export interface HydratedFlexStackerFormData extends AnnotationFields {
  stepType: 'flexStacker'
  id: string
  fillLabwareUri: string | null
  fillLabwareIds: string[]
  flexStackerFormType: FlexStackerFormType | null
  interventionMessage: string | null
  moduleId: string
}

export interface HydratedVacuumFormData extends AnnotationFields {
  stepType: 'vacuum'
  id: string
  moduleId: string
  endingHoldVentCheckbox: boolean | null
  modeType: typeof VACUUM_MODE_PRESSURE | typeof VACUUM_MODE_POWER | null
  vacuumOrderedProfileIds: string[]
  percentPower: number | null
  pressureMbar: number | null
  vacuumProfileItemsById: Record<string, VacuumProfileItem>
  programType: typeof VACUUM_PROGRAM_STATE | typeof VACUUM_PROGRAM_PROFILE
  pumpDurationCheckbox: boolean | null
  pumpDurationTime: string | null
  stateType:
    | typeof VACUUM_STATE_PUMP_ON
    | typeof VACUUM_STATE_PUMP_OFF
    | typeof VACUUM_VENT_SET_OPEN
    | typeof VACUUM_VENT_SET_CLOSED
    | null
}

// fields used in TipPositionInput
export type TipZOffsetFields =
  | 'aspirate_mmFromBottom'
  | 'blowout_mmFromBottom'
  | 'dispense_mmFromBottom'
  | 'mix_mmFromBottom'
  | 'aspirate_touchTip_mmFromTop'
  | 'dispense_touchTip_mmFromTop'
  | 'aspirate_delay_mmFromBottom'
  | 'dispense_delay_mmFromBottom'
  | 'mix_touchTip_mmFromTop'
  | 'aspirate_retract_mmFromBottom'
  | 'dispense_retract_mmFromBottom'
  | 'aspirate_submerge_mmFromBottom'
  | 'dispense_submerge_mmFromBottom'

export type TipYOffsetFields =
  | 'aspirate_y_position'
  | 'blowout_y_position'
  | 'dispense_y_position'
  | 'mix_y_position'
  | 'aspirate_retract_y_position'
  | 'dispense_retract_y_position'
  | 'aspirate_submerge_y_position'
  | 'dispense_submerge_y_position'

export type TipXOffsetFields =
  | 'aspirate_x_position'
  | 'blowout_x_position'
  | 'dispense_x_position'
  | 'mix_x_position'
  | 'aspirate_retract_x_position'
  | 'dispense_retract_x_position'
  | 'aspirate_submerge_x_position'
  | 'dispense_submerge_x_position'

export type ReferenceFields =
  | 'aspirate_position_reference'
  | 'blowout_position_reference'
  | 'dispense_position_reference'
  | 'aspirate_submerge_position_reference'
  | 'dispense_submerge_position_reference'
  | 'aspirate_retract_position_reference'
  | 'dispense_retract_position_reference'
  | 'mix_position_reference'

export type DelayCheckboxBaseFields =
  | 'aspirate_delay_checkbox'
  | 'dispense_delay_checkbox'
export type DelayCheckboxMoveLiquidFields =
  | DelayCheckboxBaseFields
  | 'aspirate_submerge_delay_seconds'
  | 'aspirate_retract_delay_seconds'
  | 'dispense_submerge_delay_seconds'
  | 'dispense_retract_delay_seconds'
export type DelaySecondsBaseFields =
  | 'aspirate_delay_seconds'
  | 'dispense_delay_seconds'
export type DelaySecondsMoveLiquidFields =
  | DelaySecondsBaseFields
  | 'aspirate_submerge_delay_seconds'
  | 'aspirate_retract_delay_seconds'
  | 'dispense_submerge_delay_seconds'
  | 'dispense_retract_delay_seconds'
export type DelayXPositionFields =
  | 'aspirate_x_position'
  | 'aspirate_submerge_x_position'
  | 'aspirate_retract_x_position'
  | 'dispense_x_position'
  | 'dispense_submerge_x_position'
  | 'dispense_retract_x_position'
export type DelayYPositionFields =
  | 'aspirate_y_position'
  | 'aspirate_submerge_y_position'
  | 'aspirate_retract_y_position'
  | 'dispense_y_position'
  | 'dispense_submerge_y_position'
  | 'dispense_retract_y_position'
export type DelayZPositionFields =
  | 'aspirate_mmFromBottom'
  | 'aspirate_submerge_mmFromBottom'
  | 'aspirate_retract_mmFromBottom'
  | 'dispense_mmFromBottom'
  | 'dispense_submerge_mmFromBottom'
  | 'dispense_retract_mmFromBottom'
export type DelayPositionReferenceFields =
  | 'aspirate_position_reference'
  | 'aspirate_submerge_position_reference'
  | 'aspirate_retract_position_reference'
  | 'dispense_position_reference'
  | 'dispense_submerge_position_reference'
  | 'dispense_retract_position_reference'
export function getIsTouchTipField(fieldName: StepFieldName): boolean {
  const touchTipFields = [
    'aspirate_touchTip_mmFromTop',
    'dispense_touchTip_mmFromTop',
    'mix_touchTip_mmFromTop',
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
export type CountPerStepType = Partial<Record<StepType, number>>

export type HydratedFormData =
  | HydratedAbsorbanceReaderFormData
  | HydratedCameraFormData
  | HydratedFlexStackerFormData
  | HydratedCommentFormData
  | HydratedHeaterShakerFormData
  | HydratedMagnetFormData
  | HydratedMixFormData
  | HydratedMoveLabwareFormData
  | HydratedMoveLiquidFormData
  | HydratedPauseFormData
  | HydratedTemperatureFormData
  | HydratedThermocyclerFormData
  | HydratedFlexStackerFormData
  | HydratedVacuumFormData
