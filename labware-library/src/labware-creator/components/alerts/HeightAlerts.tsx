import { AlertItem } from '@opentrons/components'
import { MAX_SUGGESTED_Z } from '../../fields'
import type { FormikTouched } from 'formik'
import type { LabwareFields } from '../../fields'

export interface Props {
  values: LabwareFields
  touched: FormikTouched<LabwareFields>
}

export const HeightAlerts = (props: Props): JSX.Element | null => {
  const { values, touched } = props
  const zAsNum = Number(values.labwareZDimension) // NOTE: if empty string or null, may be cast to 0, but that's fine for `>`
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
