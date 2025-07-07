import { AlertItem } from '@opentrons/components'

import { SUGGESTED_X, SUGGESTED_XY_RANGE, SUGGESTED_Y } from '../../fields'

import type { FormikTouched } from 'formik'
import type { LabwareFields } from '../../fields'

const xyMessage = (
  <div>
    Our recommended footprint for labware is {SUGGESTED_X} by {SUGGESTED_Y} +/-
    1mm. If you can fit your labware snugly into a single slot on the deck
    continue through the form. If not please contact Opentrons Support.
  </div>
)

export interface Props {
  values: LabwareFields
  touched: FormikTouched<LabwareFields>
}

export const XYDimensionAlerts = (props: Props): JSX.Element | null => {
  const { values, touched } = props
  const xAsNum = Number(values.footprintXDimension)
  const yAsNum = Number(values.footprintYDimension)
  const showXInfo =
    touched.footprintXDimension &&
    Math.abs(xAsNum - SUGGESTED_X) > SUGGESTED_XY_RANGE
  const showYInfo =
    touched.footprintYDimension &&
    Math.abs(yAsNum - SUGGESTED_Y) > SUGGESTED_XY_RANGE

  return showXInfo || showYInfo ? (
    <AlertItem type="info" title={xyMessage} />
  ) : null
}
