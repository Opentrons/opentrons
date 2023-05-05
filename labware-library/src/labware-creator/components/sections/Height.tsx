import * as React from 'react'
import { useFormikContext } from 'formik'

import { makeMaskToDecimal } from '../../fieldMasks'
import { LabwareFields } from '../../fields'
import styles from '../../styles.css'
import { isEveryFieldHidden } from '../../utils'
import { FormAlerts } from '../alerts/FormAlerts'
import { HeightAlerts } from '../alerts/HeightAlerts'
import { HeightImg } from '../diagrams'
import { HeightGuidingText } from '../HeightGuidingText'
import { TextField } from '../TextField'
import { SectionBody } from './SectionBody'

const maskTo2Decimal = makeMaskToDecimal(2)

interface ContentProps {
  values: LabwareFields
}

const Content = (props: ContentProps): JSX.Element => {
  const { values } = props
  return (
    <div className={styles.flex_row}>
      <div className={styles.instructions_column}>
        <HeightGuidingText labwareType={values.labwareType} />
      </div>
      <div className={styles.diagram_column}>
        <HeightImg
          labwareType={values.labwareType}
          aluminumBlockChildType={values.aluminumBlockChildType}
        />
      </div>
      <div className={styles.form_fields_column}>
        <TextField
          name="labwareZDimension"
          inputMasks={[maskTo2Decimal]}
          units="mm"
        />
      </div>
    </div>
  )
}

export const Height = (): JSX.Element | null => {
  const fieldList: Array<keyof LabwareFields> = [
    'labwareType',
    'labwareZDimension',
  ]
  const { values, errors, touched } = useFormikContext<LabwareFields>()

  if (isEveryFieldHidden(fieldList, values)) {
    return null
  }

  return (
    <div className={styles.new_definition_section}>
      <SectionBody label="Total Height" id="Height">
        <>
          <FormAlerts
            values={values}
            touched={touched}
            errors={errors}
            fieldList={fieldList}
          />
          <HeightAlerts values={values} touched={touched} />
          <Content values={values} />
        </>
      </SectionBody>
    </div>
  )
}
