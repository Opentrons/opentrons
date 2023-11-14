import * as React from 'react'
import { getWellRatio } from '../utils'
import { canPipetteUseLabware } from '../../utils'
import { MAGNETIC_MODULE_V1, MAGNETIC_MODULE_V2 } from '@opentrons/shared-data'
import { getPipetteCapacity } from '../../pipettes/pipetteData'
import {
  MIN_ENGAGE_HEIGHT_V1,
  MAX_ENGAGE_HEIGHT_V1,
  MIN_ENGAGE_HEIGHT_V2,
  MAX_ENGAGE_HEIGHT_V2,
  PAUSE_UNTIL_RESUME,
  PAUSE_UNTIL_TIME,
  PAUSE_UNTIL_TEMP,
  THERMOCYCLER_PROFILE,
} from '../../constants'
import { StepFieldName } from '../../form-types'

/*******************
 ** Error Messages **
 ********************/
export type FormErrorKey =
  | 'INCOMPATIBLE_ASPIRATE_LABWARE'
  | 'INCOMPATIBLE_DISPENSE_LABWARE'
  | 'INCOMPATIBLE_LABWARE'
  | 'WELL_RATIO_MOVE_LIQUID'
  | 'PAUSE_TYPE_REQUIRED'
  | 'VOLUME_TOO_HIGH'
  | 'TIME_PARAM_REQUIRED'
  | 'PAUSE_TEMP_PARAM_REQUIRED'
  | 'MAGNET_ACTION_TYPE_REQUIRED'
  | 'ENGAGE_HEIGHT_MIN_EXCEEDED'
  | 'ENGAGE_HEIGHT_MAX_EXCEEDED'
  | 'ENGAGE_HEIGHT_REQUIRED'
  | 'MODULE_ID_REQUIRED'
  | 'TARGET_TEMPERATURE_REQUIRED'
  | 'BLOCK_TEMPERATURE_REQUIRED'
  | 'LID_TEMPERATURE_REQUIRED'
  | 'PROFILE_VOLUME_REQUIRED'
  | 'PROFILE_LID_TEMPERATURE_REQUIRED'
  | 'BLOCK_TEMPERATURE_HOLD_REQUIRED'
  | 'LID_TEMPERATURE_HOLD_REQUIRED'
export interface FormError {
  title: string
  body?: React.ReactNode
  dependentFields: StepFieldName[]
}
const INCOMPATIBLE_ASPIRATE_LABWARE: FormError = {
  title: 'Selected aspirate labware is incompatible with selected pipette',
  dependentFields: ['aspirate_labware', 'pipette'],
}
const INCOMPATIBLE_DISPENSE_LABWARE: FormError = {
  title: 'Selected dispense labware is incompatible with selected pipette',
  dependentFields: ['dispense_labware', 'pipette'],
}
const INCOMPATIBLE_LABWARE: FormError = {
  title: 'Selected labware is incompatible with selected pipette',
  dependentFields: ['labware', 'pipette'],
}
const PAUSE_TYPE_REQUIRED: FormError = {
  title:
    'Must either pause for amount of time, until told to resume, or until temperature reached',
  dependentFields: ['pauseAction'],
}
const TIME_PARAM_REQUIRED: FormError = {
  title: 'Must include hours, minutes, or seconds',
  dependentFields: ['pauseAction', 'pauseHour', 'pauseMinute', 'pauseSecond'],
}
const PAUSE_TEMP_PARAM_REQUIRED: FormError = {
  title: 'Temperature is required',
  dependentFields: ['pauseAction', 'pauseTemperature'],
}

const VOLUME_TOO_HIGH = (pipetteCapacity: number): FormError => ({
  title: `Volume is greater than maximum pipette/tip volume (${pipetteCapacity} ul)`,
  dependentFields: ['pipette', 'volume'],
})

const WELL_RATIO_MOVE_LIQUID: FormError = {
  title: 'Well selection must be 1 to many, many to 1, or N to N',
  dependentFields: ['aspirate_wells', 'dispense_wells'],
}
const WELL_RATIO_MOVE_LIQUID_INTO_WASTE_CHUTE: FormError = {
  title: 'Well selection must be 1 to many, many to 1, or N to N',
  dependentFields: ['aspirate_wells'],
}
const MAGNET_ACTION_TYPE_REQUIRED: FormError = {
  title: 'Action type must be either engage or disengage',
  dependentFields: ['magnetAction'],
}
const ENGAGE_HEIGHT_REQUIRED: FormError = {
  title: 'Engage height is required',
  dependentFields: ['magnetAction', 'engageHeight'],
}
const ENGAGE_HEIGHT_MIN_EXCEEDED: FormError = {
  title: 'Specified distance is below module minimum',
  dependentFields: ['magnetAction', 'engageHeight'],
}
const ENGAGE_HEIGHT_MAX_EXCEEDED: FormError = {
  title: 'Specified distance is above module maximum',
  dependentFields: ['magnetAction', 'engageHeight'],
}
const MODULE_ID_REQUIRED: FormError = {
  title:
    'Module is required. Ensure the appropriate module is present on the deck and selected for this step',
  dependentFields: ['moduleId'],
}
const TARGET_TEMPERATURE_REQUIRED: FormError = {
  title: 'Temperature is required',
  dependentFields: ['setTemperature', 'targetTemperature'],
}
const PROFILE_VOLUME_REQUIRED: FormError = {
  title: 'Volume is required',
  dependentFields: ['thermocyclerFormType', 'profileVolume'],
}
const PROFILE_LID_TEMPERATURE_REQUIRED: FormError = {
  title: 'Temperature is required',
  dependentFields: ['thermocyclerFormType', 'profileTargetLidTemp'],
}
const LID_TEMPERATURE_REQUIRED: FormError = {
  title: 'Temperature is required',
  dependentFields: ['lidIsActive', 'lidTargetTemp'],
}
const BLOCK_TEMPERATURE_REQUIRED: FormError = {
  title: 'Temperature is required',
  dependentFields: ['blockIsActive', 'blockTargetTemp'],
}
const BLOCK_TEMPERATURE_HOLD_REQUIRED: FormError = {
  title: 'Temperature is required',
  dependentFields: ['blockIsActiveHold', 'blockTargetTempHold'],
}
const LID_TEMPERATURE_HOLD_REQUIRED: FormError = {
  title: 'Temperature is required',
  dependentFields: ['lidIsActiveHold', 'lidTargetTempHold'],
}
export type FormErrorChecker = (arg: unknown) => FormError | null
// TODO: test these

/*******************
 ** Error Checkers **
 ********************/
// TODO: real HydratedFormData type
type HydratedFormData = any
export const incompatibleLabware = (
  fields: HydratedFormData
): FormError | null => {
  const { labware, pipette } = fields
  if (!labware || !pipette) return null
  return !canPipetteUseLabware(pipette.spec, labware.def)
    ? INCOMPATIBLE_LABWARE
    : null
}
export const incompatibleDispenseLabware = (
  fields: HydratedFormData
): FormError | null => {
  const { dispense_labware, pipette } = fields
  if (!dispense_labware || !pipette) return null
  return !canPipetteUseLabware(pipette.spec, dispense_labware.def)
    ? INCOMPATIBLE_DISPENSE_LABWARE
    : null
}
export const incompatibleAspirateLabware = (
  fields: HydratedFormData
): FormError | null => {
  const { aspirate_labware, pipette } = fields
  if (!aspirate_labware || !pipette) return null
  return !canPipetteUseLabware(pipette.spec, aspirate_labware.def)
    ? INCOMPATIBLE_ASPIRATE_LABWARE
    : null
}
export const pauseForTimeOrUntilTold = (
  fields: HydratedFormData
): FormError | null => {
  const {
    pauseAction,
    pauseHour,
    pauseMinute,
    pauseSecond,
    moduleId,
    pauseTemperature,
  } = fields

  if (pauseAction === PAUSE_UNTIL_TIME) {
    // user selected pause for amount of time
    const hours = parseFloat(pauseHour) || 0
    const minutes = parseFloat(pauseMinute) || 0
    const seconds = parseFloat(pauseSecond) || 0
    const totalSeconds = hours * 3600 + minutes * 60 + seconds
    return totalSeconds <= 0 ? TIME_PARAM_REQUIRED : null
  } else if (pauseAction === PAUSE_UNTIL_TEMP) {
    // user selected pause until temperature reached
    if (moduleId == null) {
      // missing module field (reached by deleting a module from deck)
      return MODULE_ID_REQUIRED
    }

    if (!pauseTemperature) {
      // missing temperature field
      return PAUSE_TEMP_PARAM_REQUIRED
    }

    return null
  } else if (pauseAction === PAUSE_UNTIL_RESUME) {
    // user selected pause until resume
    return null
  } else {
    // user did not select a pause type
    return PAUSE_TYPE_REQUIRED
  }
}
export const wellRatioMoveLiquid = (
  fields: HydratedFormData
): FormError | null => {
  const { aspirate_wells, dispense_wells, dispense_labware } = fields
  const dispenseLabware = dispense_labware?.name ?? null
  const isDispensingIntoWasteChute =
    dispenseLabware != null ? dispenseLabware === 'wasteChute' : false
  if (!aspirate_wells || (!isDispensingIntoWasteChute && !dispense_wells))
    return null
  let dispenseWells = dispense_wells
  if (isDispensingIntoWasteChute) {
    dispenseWells = null
  }
  const wellRatioFormError = isDispensingIntoWasteChute
    ? WELL_RATIO_MOVE_LIQUID_INTO_WASTE_CHUTE
    : WELL_RATIO_MOVE_LIQUID

  return getWellRatio(aspirate_wells, dispenseWells, isDispensingIntoWasteChute)
    ? null
    : wellRatioFormError
}
export const volumeTooHigh = (fields: HydratedFormData): FormError | null => {
  const { pipette } = fields
  const volume = Number(fields.volume)
  const pipetteCapacity = getPipetteCapacity(pipette)

  if (
    !Number.isNaN(volume) &&
    !Number.isNaN(pipetteCapacity) &&
    volume > pipetteCapacity
  ) {
    return VOLUME_TOO_HIGH(pipetteCapacity)
  }

  return null
}
export const magnetActionRequired = (
  fields: HydratedFormData
): FormError | null => {
  const { magnetAction } = fields
  if (!magnetAction) return MAGNET_ACTION_TYPE_REQUIRED
  return null
}
export const engageHeightRequired = (
  fields: HydratedFormData
): FormError | null => {
  const { magnetAction, engageHeight } = fields
  return magnetAction === 'engage' && !engageHeight
    ? ENGAGE_HEIGHT_REQUIRED
    : null
}
export const moduleIdRequired = (
  fields: HydratedFormData
): FormError | null => {
  const { moduleId } = fields
  if (moduleId == null) return MODULE_ID_REQUIRED
  return null
}
export const targetTemperatureRequired = (
  fields: HydratedFormData
): FormError | null => {
  const { setTemperature, targetTemperature } = fields
  return setTemperature === 'true' && !targetTemperature
    ? TARGET_TEMPERATURE_REQUIRED
    : null
}
export const profileVolumeRequired = (
  fields: HydratedFormData
): FormError | null => {
  const { thermocyclerFormType, profileVolume } = fields
  return thermocyclerFormType === THERMOCYCLER_PROFILE && !profileVolume
    ? PROFILE_VOLUME_REQUIRED
    : null
}
export const profileTargetLidTempRequired = (
  fields: HydratedFormData
): FormError | null => {
  const { thermocyclerFormType, profileTargetLidTemp } = fields
  return thermocyclerFormType === THERMOCYCLER_PROFILE && !profileTargetLidTemp
    ? PROFILE_LID_TEMPERATURE_REQUIRED
    : null
}
export const blockTemperatureRequired = (
  fields: HydratedFormData
): FormError | null => {
  const { blockIsActive, blockTargetTemp } = fields
  return blockIsActive === true && !blockTargetTemp
    ? BLOCK_TEMPERATURE_REQUIRED
    : null
}
export const lidTemperatureRequired = (
  fields: HydratedFormData
): FormError | null => {
  const { lidIsActive, lidTargetTemp } = fields
  return lidIsActive === true && !lidTargetTemp
    ? LID_TEMPERATURE_REQUIRED
    : null
}
export const blockTemperatureHoldRequired = (
  fields: HydratedFormData
): FormError | null => {
  const { blockIsActiveHold, blockTargetTempHold } = fields
  return blockIsActiveHold === true && !blockTargetTempHold
    ? BLOCK_TEMPERATURE_HOLD_REQUIRED
    : null
}
export const lidTemperatureHoldRequired = (
  fields: HydratedFormData
): FormError | null => {
  const { lidIsActiveHold, lidTargetTempHold } = fields
  return lidIsActiveHold === true && !lidTargetTempHold
    ? LID_TEMPERATURE_HOLD_REQUIRED
    : null
}
export const engageHeightRangeExceeded = (
  fields: HydratedFormData
): FormError | null => {
  const { magnetAction, engageHeight } = fields
  const moduleEntity = fields.meta?.module
  const model = moduleEntity?.model

  if (magnetAction === 'engage') {
    if (model === MAGNETIC_MODULE_V1) {
      if (engageHeight < MIN_ENGAGE_HEIGHT_V1) {
        return ENGAGE_HEIGHT_MIN_EXCEEDED
      } else if (engageHeight > MAX_ENGAGE_HEIGHT_V1) {
        return ENGAGE_HEIGHT_MAX_EXCEEDED
      }
    } else if (model === MAGNETIC_MODULE_V2) {
      if (engageHeight < MIN_ENGAGE_HEIGHT_V2) {
        return ENGAGE_HEIGHT_MIN_EXCEEDED
      } else if (engageHeight > MAX_ENGAGE_HEIGHT_V2) {
        return ENGAGE_HEIGHT_MAX_EXCEEDED
      }
    } else {
      console.warn(`unhandled model for engageHeightRangeExceeded: ${model}`)
    }
  }

  return null
}

/*******************
 **     Helpers    **
 ********************/
type ComposeErrors = (
  ...errorCheckers: FormErrorChecker[]
) => (arg: unknown) => FormError[]
export const composeErrors: ComposeErrors = (
  ...errorCheckers: FormErrorChecker[]
) => value =>
  errorCheckers.reduce<FormError[]>((acc, errorChecker) => {
    const possibleError = errorChecker(value)
    return possibleError ? [...acc, possibleError] : acc
  }, [])
