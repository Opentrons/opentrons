import * as React from 'react'
import { useFormikContext } from 'formik'

import { yesNoOptions } from '../../fields'
import type { LabwareFields } from '../../fields'
import styles from '../../styles.css'
import { isEveryFieldHidden } from '../../utils'
import { FormAlerts } from '../alerts/FormAlerts'
import { RadioField } from '../RadioField'
import { SectionBody } from './SectionBody'

export const Regularity = (): JSX.Element | null => {
  const fieldList: Array<keyof LabwareFields> = ['homogeneousWells']
  const { values, errors, touched } = useFormikContext<LabwareFields>()

  if (isEveryFieldHidden(fieldList, values)) {
    return null
  }

  return (
    <SectionBody label="Regularity" id="Regularity">
      <>
        <FormAlerts
          values={values}
          touched={touched}
          errors={errors}
          fieldList={fieldList}
        />
        <div className={styles.flex_row}>
          <div className={styles.homogenous_wells_section}>
            <RadioField name="homogeneousWells" options={yesNoOptions} />
          </div>
        </div>
      </>
    </SectionBody>
  )
}
