import { AlertItem } from '@opentrons/components'

import { MAX_SUGGESTED_GRIPPER_Z } from '../../fields'

import type { FormikTouched } from 'formik'
import type { LabwareFields } from '../../fields'

export interface Props {
  values: LabwareFields
  touched: FormikTouched<LabwareFields>
}

export const StackingAlerts = (props: Props): JSX.Element | null => {
  const { values, touched } = props
  const zAsNum = Number(values.stackedLabwareZDimension)
  if (touched.stackedLabwareZDimension && zAsNum > MAX_SUGGESTED_GRIPPER_Z) {
    return (
      <AlertItem
        type="info"
        title="This labware may be too tall for gripper to pick up when stacked. Please test on robot."
      />
    )
  }
  return null
}
