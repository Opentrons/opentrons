import * as React from 'react'
import { useFormikContext } from 'formik'
import { makeMaskToDecimal } from '../../fieldMasks'
import { LabwareFields } from '../../fields'
import { getFormAlerts } from '../utils/getFormAlerts'
import { TextField } from '../TextField'
import { SectionBody } from './SectionBody'

import styles from '../../styles.css'

const maskTo2Decimal = makeMaskToDecimal(2)

interface ContentProps {
  labwareType: string
}

const Content = (props: ContentProps): JSX.Element => {
  // @ts-expect-error `includes` doesn't want to take null/undefined
  const wellLabel = ['aluminumBlock', 'tubeRack'].includes(props.labwareType)
    ? 'tube'
    : 'well'
  return (
    <div className={styles.flex_row}>
      <div className={styles.volume_instructions_column}>
        <p>Total maximum volume of each {wellLabel}.</p>
      </div>

      <div className={styles.form_fields_column}>
        <TextField name="wellVolume" inputMasks={[maskTo2Decimal]} units="μL" />
      </div>
    </div>
  )
}

export const Volume = (): JSX.Element => {
  const fieldList: Array<keyof LabwareFields> = ['wellVolume']
  const { values, errors, touched } = useFormikContext<LabwareFields>()

  return (
    <div className={styles.new_definition_section}>
      <SectionBody label="Volume">
        <>
          {getFormAlerts({ values, touched, errors, fieldList })}
          <Content labwareType={values.labwareType} />
        </>
      </SectionBody>
    </div>
  )
}
