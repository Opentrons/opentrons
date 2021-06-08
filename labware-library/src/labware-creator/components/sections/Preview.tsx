import * as React from 'react'
import { useFormikContext } from 'formik'
import { LabwareFields } from '../../fields'
import { ConditionalLabwareRender } from '../ConditionalLabwareRender'
import { FormLevelErrorAlerts } from '../FormLevelErrorAlerts'

import { SectionBody } from './SectionBody'

import styles from '../../styles.css'

export const Preview = (): JSX.Element => {
  const { values, errors } = useFormikContext<LabwareFields>()

  return (
    <SectionBody label="Check your work">
      <FormLevelErrorAlerts errors={errors} />
      <div className={styles.preview_labware}>
        <ConditionalLabwareRender values={values} />
        <p className={styles.preview_instructions}>
          Check that the size, spacing, and shape of your wells looks correct.
        </p>
      </div>
    </SectionBody>
  )
}
