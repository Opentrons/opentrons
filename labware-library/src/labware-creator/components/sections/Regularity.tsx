import * as React from 'react'
import { useFormikContext } from 'formik'
import { yesNoOptions } from '../../fields'
import { getFormAlerts } from '../utils/getFormAlerts'
import { RadioField } from '../RadioField'
import { SectionBody } from './SectionBody'

import styles from '../../styles.css'
import type { LabwareFields } from '../../fields'

export const Regularity = (): JSX.Element => {
  const fieldList: Array<keyof LabwareFields> = ['homogeneousWells']
  const { values, errors, touched } = useFormikContext<LabwareFields>()

  return (
    <SectionBody label="Regularity">
      <>
        {getFormAlerts({ values, touched, errors, fieldList })}
        <div className={styles.flex_row}>
          <div className={styles.homogenous_wells_section}>
            <RadioField name="homogeneousWells" options={yesNoOptions} />
          </div>
        </div>
      </>
    </SectionBody>
  )
}
