import * as React from 'react'
import { FormikTouched } from 'formik'
import { LabwareFields, MAX_SUGGESTED_Z } from '../../fields'
import { AlertItem } from '@opentrons/components'

export const getHeightAlerts = (
  values: LabwareFields,
  touched: FormikTouched<LabwareFields>
): JSX.Element | null => {
  const { labwareZDimension } = values
  const zAsNum = Number(labwareZDimension) // NOTE: if empty string or null, may be cast to 0, but that's fine for `>`
  if (touched.labwareZDimension && zAsNum > MAX_SUGGESTED_Z) {
    return (
      <AlertItem
        type="info"
        title="This labware may be too tall to work with some pipette + tip combinations. Please test on robot."
      />
    )
  }
  return null
}
