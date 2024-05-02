import * as React from 'react'
import { useFormikContext } from 'formik'
import { LabwareFields } from '../../fields'
import { isEveryFieldHidden } from '../../utils'
import { getIsOpentronsTubeRack } from '../../utils/getIsOpentronsTubeRack'
import { FormAlerts } from '../alerts/FormAlerts'
import { TextField } from '../TextField'
import { SectionBody } from './SectionBody'

import styles from '../../styles.module.css'
import { Flex } from '@opentrons/components'

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
        <Flex>
          <div className={styles.brand_column}>
            <TextField name="brand" />
          </div>
          <div className={styles.brand_id_column}>
            <TextField name="brandId" caption="Separate multiple by comma" />
          </div>
        </Flex>
      )}
      {showGroupBrand && (
        <Flex>
          <div className={styles.brand_column}>
            <TextField name="groupBrand" />
          </div>
          <div className={styles.brand_id_column}>
            <TextField
              name="groupBrandId"
              caption="Separate multiple by comma"
            />
          </div>
        </Flex>
      )}
    </>
  )
}

export const Description = (): JSX.Element | null => {
  const fieldList: Array<keyof LabwareFields> = [
    'brand',
    'brandId',
    'groupBrand',
    'groupBrandId',
  ]
  const { values, errors, touched } = useFormikContext<LabwareFields>()

  if (isEveryFieldHidden(fieldList, values)) {
    return null
  }

  return (
    <SectionBody label="Description" id="Description">
      <FormAlerts
        values={values}
        touched={touched}
        errors={errors}
        fieldList={fieldList}
      />
      <Content values={values} />
    </SectionBody>
  )
}
