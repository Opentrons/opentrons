import * as React from 'react'
import { useFormikContext } from 'formik'
import { makeMaskToDecimal } from '../../fieldMasks'
import { LabwareFields } from '../../fields'
import { getFormAlerts } from '../utils/getFormAlerts'
import { TextField } from '../TextField'
import { SectionBody } from './SectionBody'

import styles from '../../styles.css'

const maskTo2Decimal = makeMaskToDecimal(2)

const getContent = (): JSX.Element => (
  <div className={styles.flex_row}>
    <div className={styles.volume_instructions_column}>
      <p>Total maximum volume of each well.</p>
    </div>

    <div className={styles.form_fields_column}>
      <TextField name="wellVolume" inputMasks={[maskTo2Decimal]} units="μL" />
    </div>
  </div>
)

export const Volume = (): JSX.Element => {
  const fieldList: Array<keyof LabwareFields> = ['wellVolume']
  const { values, errors, touched } = useFormikContext<LabwareFields>()

  return (
    <div className={styles.new_definition_section}>
      <SectionBody label="Volume">
        <>
          {getFormAlerts({ values, touched, errors, fieldList })}
          {getContent()}
        </>
      </SectionBody>
    </div>
  )
}
