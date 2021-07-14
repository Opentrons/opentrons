import * as React from 'react'
import { useFormikContext } from 'formik'
import { LabwareFields } from '../../fields'
import { getIsOpentronsTubeRack, isEveryFieldHidden } from '../../utils'
import { FormAlerts } from '../alerts/FormAlerts'
import { TextField } from '../TextField'
import { SectionBody } from './SectionBody'

import styles from '../../styles.css'

interface Props {
  values: LabwareFields
}
const Content = (props: Props): JSX.Element => {
  const labwareType = props.values.labwareType
  const isOpentronsTubeRack = getIsOpentronsTubeRack(props.values)
  const showBrand = !isOpentronsTubeRack
  const showGroupBrand = labwareType === 'tubeRack'
  return (
    <>
      {showBrand && (
        <div className={styles.flex_row}>
          <div className={styles.brand_column}>
            <TextField name="brand" />
          </div>
          <div className={styles.brand_id_column}>
            <TextField name="brandId" caption="Separate multiple by comma" />
          </div>
        </div>
      )}
      {showGroupBrand && (
        <div className={styles.flex_row}>
          <div className={styles.brand_column}>
            <TextField name="groupBrand" />
          </div>
          <div className={styles.brand_id_column}>
            <TextField
              name="groupBrandId"
              caption="Separate multiple by comma"
            />
          </div>
        </div>
      )}
    </>
  )
}

export const Description = (): JSX.Element | null => {
  const fieldList: Array<keyof LabwareFields> = ['brand', 'brandId']
  const { values, errors, touched } = useFormikContext<LabwareFields>()

  if (isEveryFieldHidden(fieldList, values)) {
    return null
  }

  return (
    <SectionBody label="Description" id="Description">
      <FormAlerts touched={touched} errors={errors} fieldList={fieldList} />
      <Content values={values} />
    </SectionBody>
  )
}
