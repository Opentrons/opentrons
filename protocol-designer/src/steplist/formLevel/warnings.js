// @flow
import * as React from 'react'
import { getWellTotalVolume } from '@opentrons/shared-data'
import {
  MIN_ENGAGE_HEIGHT,
  MAX_ENGAGE_HEIGHT,
  MIN_TEMP_MODULE_TEMP,
  MAX_TEMP_MODULE_TEMP,
} from '../../constants'
import KnowledgeBaseLink from '../../components/KnowledgeBaseLink'
import type { FormError } from './errors'
/*******************
 ** Warning Messages **
 ********************/

export type FormWarningType =
  | 'BELOW_PIPETTE_MINIMUM_VOLUME'
  | 'OVER_MAX_WELL_VOLUME'
  | 'BELOW_MIN_DISPOSAL_VOLUME'
  | 'ENGAGE_HEIGHT_MIN_EXCEEDED'
  | 'ENGAGE_HEIGHT_MAX_EXCEEDED'
  | 'TEMPERATURE_MIN_EXCEEDED'
  | 'TEMPERATURE_MAX_EXCEEDED'

export type FormWarning = {
  ...$Exact<FormError>,
  type: FormWarningType,
}
// TODO: Ian 2018-12-06 use i18n for title/body text
const FORM_WARNINGS: { [FormWarningType]: FormWarning } = {
  BELOW_PIPETTE_MINIMUM_VOLUME: {
    type: 'BELOW_PIPETTE_MINIMUM_VOLUME',
    title: 'Specified volume is below pipette minimum',
    dependentFields: ['pipette', 'volume'],
  },
  OVER_MAX_WELL_VOLUME: {
    type: 'OVER_MAX_WELL_VOLUME',
    title: 'Dispense volume will overflow a destination well',
    dependentFields: ['dispense_labware', 'dispense_wells', 'volume'],
  },
  BELOW_MIN_DISPOSAL_VOLUME: {
    type: 'BELOW_MIN_DISPOSAL_VOLUME',
    title: 'Below Recommended disposal volume',
    body: (
      <React.Fragment>
        For accuracy in multi-dispense actions we recommend you use a disposal
        volume of at least the pipette&apos;s minimum. Read more{' '}
        <KnowledgeBaseLink to="multiDispense">here</KnowledgeBaseLink>.
      </React.Fragment>
    ),
    dependentFields: ['disposalVolume_volume', 'pipette'],
  },
  ENGAGE_HEIGHT_MIN_EXCEEDED: {
    type: 'ENGAGE_HEIGHT_MIN_EXCEEDED',
    title: 'Specified distance is below module minimum',
    dependentFields: ['magnetAction', 'engageHeight'],
  },
  ENGAGE_HEIGHT_MAX_EXCEEDED: {
    type: 'ENGAGE_HEIGHT_MAX_EXCEEDED',
    title: 'Specified distance is above module maximum',
    dependentFields: ['magnetAction', 'engageHeight'],
  },
  TEMPERATURE_MIN_EXCEEDED: {
    type: 'TEMPERATURE_MIN_EXCEEDED',
    title: 'Specified temperature is below module minimum',
    dependentFields: ['setTemperature', 'targetTemperature'],
  },
  TEMPERATURE_MAX_EXCEEDED: {
    type: 'TEMPERATURE_MAX_EXCEEDED',
    title: 'Specified temperature is above module maximum',
    dependentFields: ['setTemperature', 'targetTemperature'],
  },
}
export type WarningChecker = mixed => ?FormWarning

// TODO: test these
/*******************
 ** Warning Checkers **
 ********************/
// TODO: real HydratedFormData type
type HydratedFormData = any

export const belowPipetteMinimumVolume = (
  fields: HydratedFormData
): ?FormWarning => {
  const { pipette, volume } = fields
  if (!(pipette && pipette.spec)) return null
  return volume < pipette.spec.minVolume
    ? FORM_WARNINGS.BELOW_PIPETTE_MINIMUM_VOLUME
    : null
}

export const maxDispenseWellVolume = (
  fields: HydratedFormData
): ?FormWarning => {
  const { dispense_labware, dispense_wells, volume } = fields
  if (!dispense_labware || !dispense_wells) return null
  const hasExceeded = dispense_wells.some(well => {
    const maximum = getWellTotalVolume(dispense_labware.def, well)
    return maximum && volume > maximum
  })
  return hasExceeded ? FORM_WARNINGS.OVER_MAX_WELL_VOLUME : null
}

export const minDisposalVolume = (fields: HydratedFormData): ?FormWarning => {
  const {
    disposalVolume_checkbox,
    disposalVolume_volume,
    pipette,
    path,
  } = fields
  if (!(pipette && pipette.spec) || path !== 'multiDispense') return null
  const isUnselected = !disposalVolume_checkbox || !disposalVolume_volume
  if (isUnselected) return FORM_WARNINGS.BELOW_MIN_DISPOSAL_VOLUME
  const isBelowMin = disposalVolume_volume < pipette.spec.minVolume
  return isBelowMin ? FORM_WARNINGS.BELOW_MIN_DISPOSAL_VOLUME : null
}

export const engageHeightRangeExceeded = (
  fields: HydratedFormData
): ?FormWarning => {
  const { magnetAction, engageHeight } = fields
  if (magnetAction === 'engage' && engageHeight < MIN_ENGAGE_HEIGHT) {
    return FORM_WARNINGS.ENGAGE_HEIGHT_MIN_EXCEEDED
  } else if (magnetAction === 'engage' && engageHeight > MAX_ENGAGE_HEIGHT) {
    return FORM_WARNINGS.ENGAGE_HEIGHT_MAX_EXCEEDED
  }
  return null
}

export const temperatureRangeExceeded = (
  fields: HydratedFormData
): ?FormWarning => {
  const { setTemperature, targetTemperature } = fields
  if (setTemperature === 'true' && targetTemperature < MIN_TEMP_MODULE_TEMP) {
    return FORM_WARNINGS.TEMPERATURE_MIN_EXCEEDED
  } else if (
    setTemperature === 'true' &&
    targetTemperature > MAX_TEMP_MODULE_TEMP
  ) {
    return FORM_WARNINGS.TEMPERATURE_MAX_EXCEEDED
  }
  return null
}

/*******************
 **     Helpers    **
 ********************/

export const composeWarnings = (...warningCheckers: Array<WarningChecker>) => (
  formData: mixed
): Array<FormWarning> =>
  warningCheckers.reduce((acc, checker) => {
    const possibleWarning = checker(formData)
    return possibleWarning ? [...acc, possibleWarning] : acc
  }, [])
