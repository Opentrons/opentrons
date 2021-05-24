import * as React from 'react'
import { FormikTouched } from 'formik'
import { LabwareFields } from '../../fields'
import { AlertItem } from '@opentrons/components'

export const getTipFitAlerts = (
  values: LabwareFields,
  touched: FormikTouched<LabwareFields>
): JSX.Element | null => {
  const { handPlacedTipFit } = values
  if (touched.handPlacedTipFit && handPlacedTipFit === 'snug') {
    return (
      <AlertItem
        type="info"
        title="If your tip seems to fit when placed by hand it may work on the OT-2.  Proceed through the form to generate a definition. Once you have a definition you can check performance on the robot. "
      />
    )
  }
  return null
}
