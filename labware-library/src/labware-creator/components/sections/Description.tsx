import * as React from 'react'
import { useFormikContext } from 'formik'
import { LabwareFields } from '../../fields'
import { isEveryFieldHidden } from '../../utils'
import { FormAlerts } from '../alerts/FormAlerts'
import { TextField } from '../TextField'
import { SectionBody } from './SectionBody'

import styles from '../../styles.css'

const Content = (): JSX.Element => (
  <div className={styles.flex_row}>
    <div className={styles.brand_column}>
      <TextField name="brand" />
    </div>
    <div className={styles.brand_id_column}>
      <TextField name="brandId" caption="Separate multiple by comma" />
    </div>
  </div>
)

export const Description = (): JSX.Element | null => {
  const fieldList: Array<keyof LabwareFields> = ['brand', 'brandId']
  const { values, errors, touched } = useFormikContext<LabwareFields>()

  if (isEveryFieldHidden(fieldList, values)) {
    return null
  }

  return (
    <SectionBody label="Description">
      <FormAlerts touched={touched} errors={errors} fieldList={fieldList} />
      <Content />
    </SectionBody>
  )
}
