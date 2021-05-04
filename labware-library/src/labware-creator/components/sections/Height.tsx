import * as React from 'react'
import { useFormikContext } from 'formik'
import { makeMaskToDecimal } from '../../fieldMasks'
import { LabwareFields } from '../../fields'
import { getFormAlerts } from '../utils/getFormAlerts'
import { getHeightAlerts } from '../utils/getHeightAlerts'
import { TextField } from '../TextField'
import { HeightImg } from '../diagrams'
import { HeightGuidingText } from '../HeightGuidingText'
import { SectionBody } from './SectionBody'

import styles from '../../styles.css'

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

export const Height = (): JSX.Element => {
  const fieldList: Array<keyof LabwareFields> = [
    'labwareType',
    'labwareZDimension',
  ]
  const { values, errors, touched } = useFormikContext<LabwareFields>()

  return (
    <div className={styles.new_definition_section}>
      <SectionBody
        label={
          // @ts-expect-error(IL, 2021-03-24): `includes` doesn't want to take null/undefined
          ['aluminumBlock', 'tubeRack'].includes(values.labwareType)
            ? 'Total Height'
            : 'Height'
        }
      >
        <>
          {getFormAlerts({ values, touched, errors, fieldList })}
          {getHeightAlerts(values, touched)}
          <Content values={values} />
        </>
      </SectionBody>
    </div>
  )
}
