import { AlertItem } from '@opentrons/components'

import { LABWARE_TOO_TALL_MESSAGE } from '../../../localization'
import { MAX_SUGGESTED_GRIPPER_Z } from '../../fields'

import type { FormikTouched } from 'formik'
import type { LabwareFields } from '../../fields'

export interface Props {
  values: LabwareFields
  touched: FormikTouched<LabwareFields>
}

export const StackingAlerts = (props: Props): JSX.Element | null => {
  const { values, touched } = props
  const zAsNum = values.stackedLabwareZDimension ?? 0
  if (touched.stackedLabwareZDimension && zAsNum > MAX_SUGGESTED_GRIPPER_Z) {
    return <AlertItem type="info" title={LABWARE_TOO_TALL_MESSAGE} />
  }
  return null
}
