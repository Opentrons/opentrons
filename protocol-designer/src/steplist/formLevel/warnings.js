// @flow
import * as React from 'react'
import {getWellTotalVolume} from '@opentrons/shared-data'
import type {StepFieldName} from '../fieldLevel'
import KnowledgeBaseLink from '../../components/KnowledgeBaseLink'

export const DISPOSAL_PERCENTAGE = 0.2 // 20% percent of pipette capacity
/*******************
** Warning Messages **
********************/

export type FormWarningType =
  | 'OVER_MAX_WELL_VOLUME'
  | 'BELOW_MIN_DISPOSAL_VOLUME'

export type FormWarning = {
  type: FormWarningType,
  title: string,
  body?: React.Node,
  dependentFields: Array<StepFieldName>,
}
const FORM_WARNINGS: {[FormWarningType]: FormWarning} = {
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
        For accuracy in distribute actions we recommend you use a disposal volume
        of at least 20% of the tip&apos;s capacity.
        Read more <KnowledgeBaseLink to='distribute'>here</KnowledgeBaseLink>.
      </React.Fragment>
    ),
    dependentFields: ['aspirate_disposalVol_volume', 'pipette'],
  },
}
export type WarningChecker = (mixed) => ?FormWarning

// TODO: test these
/*******************
** Warning Checkers **
********************/
// TODO: real HydratedFormData type
type HydratedFormData = any

export const maxDispenseWellVolume = (fields: HydratedFormData): ?FormWarning => {
  const {dispense_labware, dispense_wells, volume} = fields
  if (!dispense_labware || !dispense_wells) return null
  const hasExceeded = dispense_wells.some(well => {
    const maximum = getWellTotalVolume(dispense_labware.type, well)
    return maximum && (volume > maximum)
  })
  return hasExceeded ? FORM_WARNINGS.OVER_MAX_WELL_VOLUME : null
}

export const minDisposalVolume = (fields: HydratedFormData): ?FormWarning => {
  const {aspirate_disposalVol_checkbox, aspirate_disposalVol_volume, pipette} = fields
  if (!pipette) return null
  const isUnselected = !aspirate_disposalVol_checkbox || !aspirate_disposalVol_volume
  if (isUnselected) return FORM_WARNINGS.BELOW_MIN_DISPOSAL_VOLUME
  const isBelowMin = aspirate_disposalVol_volume < (DISPOSAL_PERCENTAGE * pipette.maxVolume)
  return isBelowMin ? FORM_WARNINGS.BELOW_MIN_DISPOSAL_VOLUME : null
}

/*******************
**     Helpers    **
********************/

export const composeWarnings = (...warningCheckers: Array<WarningChecker>) => (formData: mixed): Array<FormWarning> => (
  warningCheckers.reduce((acc, checker) => {
    const possibleWarning = checker(formData)
    return possibleWarning ? [...acc, possibleWarning] : acc
  }, [])
)
