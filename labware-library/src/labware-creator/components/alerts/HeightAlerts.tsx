import * as React from 'react'
import { FormikTouched } from 'formik'
import { LabwareFields, MAX_SUGGESTED_Z } from '../../fields'
import { LegacyAlertItem } from '@opentrons/components'

export interface Props {
  values: LabwareFields
  touched: FormikTouched<LabwareFields>
}

export const HeightAlerts = (props: Props): JSX.Element | null => {
  const { values, touched } = props
  const zAsNum = Number(values.labwareZDimension) // NOTE: if empty string or null, may be cast to 0, but that's fine for `>`
  if (touched.labwareZDimension && zAsNum > MAX_SUGGESTED_Z) {
    return (
      <LegacyAlertItem
        type="info"
        title="This labware may be too tall to work with some pipette + tip combinations. Please test on robot."
      />
    )
  }
  return null
}
