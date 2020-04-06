// @flow
import * as React from 'react'
import { getWellRatio } from '../utils'
import { canPipetteUseLabware } from '../../utils'
import { MAGNETIC_MODULE_V1, MAGNETIC_MODULE_V2 } from '@opentrons/shared-data'
import {
  MIN_ENGAGE_HEIGHT_V1,
  MAX_ENGAGE_HEIGHT_V1,
  MIN_ENGAGE_HEIGHT_V2,
  MAX_ENGAGE_HEIGHT_V2,
  PAUSE_UNTIL_RESUME,
  PAUSE_UNTIL_TIME,
  PAUSE_UNTIL_TEMP,
} from '../../constants'
import type { StepFieldName } from '../../form-types'

/*******************
 ** Error Messages **
 ********************/
export type FormErrorKey =
  | 'INCOMPATIBLE_ASPIRATE_LABWARE'
  | 'INCOMPATIBLE_DISPENSE_LABWARE'
  | 'INCOMPATIBLE_LABWARE'
  | 'WELL_RATIO_MOVE_LIQUID'
  | 'PAUSE_TYPE_REQUIRED'
  | 'TIME_PARAM_REQUIRED'
  | 'PAUSE_TEMP_PARAM_REQUIRED'
  | 'MAGNET_ACTION_TYPE_REQUIRED'
  | 'ENGAGE_HEIGHT_MIN_EXCEEDED'
  | 'ENGAGE_HEIGHT_MAX_EXCEEDED'
  | 'ENGAGE_HEIGHT_REQUIRED'
  | 'MODULE_ID_REQUIRED'
  | 'TARGET_TEMPERATURE_REQUIRED'

export type FormError = {
  title: string,
  body?: React.Node,
  dependentFields: Array<StepFieldName>,
}

const FORM_ERRORS: { [FormErrorKey]: FormError } = {
  INCOMPATIBLE_ASPIRATE_LABWARE: {
    title: 'Selected aspirate labware is incompatible with selected pipette',
    dependentFields: ['aspirate_labware', 'pipette'],
  },
  INCOMPATIBLE_DISPENSE_LABWARE: {
    title: 'Selected dispense labware is incompatible with selected pipette',
    dependentFields: ['dispense_labware', 'pipette'],
  },
  INCOMPATIBLE_LABWARE: {
    title: 'Selected labware is incompatible with selected pipette',
    dependentFields: ['labware', 'pipette'],
  },
  PAUSE_TYPE_REQUIRED: {
    title:
      'Must either pause for amount of time, until told to resume, or until temperature reached',
    dependentFields: ['pauseAction'],
  },
  TIME_PARAM_REQUIRED: {
    title: 'Must include hours, minutes, or seconds',
    dependentFields: ['pauseAction', 'pauseHour', 'pauseMinute', 'pauseSecond'],
  },
  PAUSE_TEMP_PARAM_REQUIRED: {
    title: 'Temperature is required',
    dependentFields: ['pauseAction', 'pauseTemperature'],
  },
  WELL_RATIO_MOVE_LIQUID: {
    title: 'Well selection must be 1 to many, many to 1, or N to N',
    dependentFields: ['aspirate_wells', 'dispense_wells'],
  },
  MAGNET_ACTION_TYPE_REQUIRED: {
    title: 'Action type must be either engage or disengage',
    dependentFields: ['magnetAction'],
  },
  ENGAGE_HEIGHT_REQUIRED: {
    title: 'Engage height is required',
    dependentFields: ['magnetAction', 'engageHeight'],
  },
  ENGAGE_HEIGHT_MIN_EXCEEDED: {
    title: 'Specified distance is below module minimum',
    dependentFields: ['magnetAction', 'engageHeight'],
  },
  ENGAGE_HEIGHT_MAX_EXCEEDED: {
    title: 'Specified distance is above module maximum',
    dependentFields: ['magnetAction', 'engageHeight'],
  },
  MODULE_ID_REQUIRED: {
    title:
      'Module is required. Ensure the appropriate module is present on the deck and selected for this step',
    dependentFields: ['moduleId'],
  },
  TARGET_TEMPERATURE_REQUIRED: {
    title: 'Temperature is required',
    dependentFields: ['setTemperature', 'targetTemperature'],
  },
}
export type FormErrorChecker = mixed => ?FormError

// TODO: test these
/*******************
 ** Error Checkers **
 ********************/

// TODO: real HydratedFormData type
type HydratedFormData = any

export const incompatibleLabware = (fields: HydratedFormData): ?FormError => {
  const { labware, pipette } = fields
  if (!labware || !pipette) return null
  return !canPipetteUseLabware(pipette.spec, labware.def)
    ? FORM_ERRORS.INCOMPATIBLE_LABWARE
    : null
}

export const incompatibleDispenseLabware = (
  fields: HydratedFormData
): ?FormError => {
  const { dispense_labware, pipette } = fields
  if (!dispense_labware || !pipette) return null
  return !canPipetteUseLabware(pipette.spec, dispense_labware.def)
    ? FORM_ERRORS.INCOMPATIBLE_DISPENSE_LABWARE
    : null
}

export const incompatibleAspirateLabware = (
  fields: HydratedFormData
): ?FormError => {
  const { aspirate_labware, pipette } = fields
  if (!aspirate_labware || !pipette) return null
  return !canPipetteUseLabware(pipette.spec, aspirate_labware.def)
    ? FORM_ERRORS.INCOMPATIBLE_ASPIRATE_LABWARE
    : null
}

export const pauseForTimeOrUntilTold = (
  fields: HydratedFormData
): ?FormError => {
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
    return totalSeconds <= 0 ? FORM_ERRORS.TIME_PARAM_REQUIRED : null
  } else if (pauseAction === PAUSE_UNTIL_TEMP) {
    // user selected pause until temperature reached
    if (moduleId == null) {
      // missing module field (reached by deleting a module from deck)
      return FORM_ERRORS.MODULE_ID_REQUIRED
    }
    if (!pauseTemperature) {
      // missing temperature field
      return FORM_ERRORS.PAUSE_TEMP_PARAM_REQUIRED
    }
    return null
  } else if (pauseAction === PAUSE_UNTIL_RESUME) {
    // user selected pause until resume
    return null
  } else {
    // user did not select a pause type
    return FORM_ERRORS.PAUSE_TYPE_REQUIRED
  }
}

export const wellRatioMoveLiquid = (
  fields: HydratedFormData
): FormError | null => {
  const { aspirate_wells, dispense_wells } = fields
  if (!aspirate_wells || !dispense_wells) return null
  return getWellRatio(aspirate_wells, dispense_wells)
    ? null
    : FORM_ERRORS.WELL_RATIO_MOVE_LIQUID
}

export const magnetActionRequired = (
  fields: HydratedFormData
): FormError | null => {
  const { magnetAction } = fields
  if (!magnetAction) return FORM_ERRORS.MAGNET_ACTION_TYPE_REQUIRED
  return null
}

export const engageHeightRequired = (
  fields: HydratedFormData
): FormError | null => {
  const { magnetAction, engageHeight } = fields
  return magnetAction === 'engage' && !engageHeight
    ? FORM_ERRORS.ENGAGE_HEIGHT_REQUIRED
    : null
}

export const moduleIdRequired = (
  fields: HydratedFormData
): FormError | null => {
  const { moduleId } = fields
  if (moduleId == null) return FORM_ERRORS.MODULE_ID_REQUIRED
  return null
}

export const targetTemperatureRequired = (
  fields: HydratedFormData
): FormError | null => {
  const { setTemperature, targetTemperature } = fields
  return setTemperature === 'true' && !targetTemperature
    ? FORM_ERRORS.TARGET_TEMPERATURE_REQUIRED
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
        return FORM_ERRORS.ENGAGE_HEIGHT_MIN_EXCEEDED
      } else if (engageHeight > MAX_ENGAGE_HEIGHT_V1) {
        return FORM_ERRORS.ENGAGE_HEIGHT_MAX_EXCEEDED
      }
    } else if (model === MAGNETIC_MODULE_V2) {
      if (engageHeight < MIN_ENGAGE_HEIGHT_V2) {
        return FORM_ERRORS.ENGAGE_HEIGHT_MIN_EXCEEDED
      } else if (engageHeight > MAX_ENGAGE_HEIGHT_V2) {
        return FORM_ERRORS.ENGAGE_HEIGHT_MAX_EXCEEDED
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

export const composeErrors = (...errorCheckers: Array<FormErrorChecker>) => (
  value: mixed
): Array<FormError> =>
  errorCheckers.reduce((acc, errorChecker) => {
    const possibleError = errorChecker(value)
    return possibleError ? [...acc, possibleError] : acc
  }, [])
