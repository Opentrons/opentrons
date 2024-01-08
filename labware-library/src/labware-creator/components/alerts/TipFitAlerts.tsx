import * as React from 'react'
import { FormikTouched } from 'formik'
import { LabwareFields } from '../../fields'
import { LegacyAlertItem } from '@opentrons/components'

export interface Props {
  values: LabwareFields
  touched: FormikTouched<LabwareFields>
}

export const TipFitAlerts = (props: Props): JSX.Element | null => {
  const { values, touched } = props
  if (touched.handPlacedTipFit && values.handPlacedTipFit === 'snug') {
    return (
      <LegacyAlertItem
        type="info"
        title="If your tip seems to fit when placed by hand it may work on the OT-2.  Proceed through the form to generate a definition. Once you have a definition you can check performance on the robot. "
      />
    )
  }
  return null
}
