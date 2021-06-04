import * as React from 'react'
import { useFormikContext } from 'formik'
import { makeMaskToDecimal } from '../../fieldMasks'
import { displayAsTube } from '../../utils'
import { LabwareFields } from '../../fields'
import { FormAlerts } from '../alerts/FormAlerts'
import { TextField } from '../TextField'
import { RadioField } from '../RadioField'
import { DepthImg } from '../diagrams'
import { SectionBody } from './SectionBody'
import { wellBottomShapeOptionsWithIcons } from '../optionsWithImages'

import styles from '../../styles.css'

const maskTo2Decimal = makeMaskToDecimal(2)

interface Props {
  values: LabwareFields
}

// TODO (ka 2021-5-7): Broke this out here since we will need to have more conditions for tips
const Instructions = (props: Props): JSX.Element => {
  const { values } = props
  return (
    <>
      <p>
        Reference the measurement from the top of the{' '}
        {displayAsTube(values) ? 'tube' : 'well'} (include any lip but exclude
        any cap) to the bottom of the <strong>inside</strong> of the{' '}
        {displayAsTube(values) ? 'tube' : 'well'}.
      </p>

      <p>
        Depth informs the robot how far down it can go inside a{' '}
        {displayAsTube(values) ? 'tube' : 'well'}.
      </p>
    </>
  )
}

const Content = (props: Props): JSX.Element => {
  const { values } = props
  return (
    <div className={styles.flex_row}>
      <div className={styles.instructions_column}>
        <Instructions values={values} />
      </div>
      <div className={styles.diagram_column}>
        <DepthImg
          labwareType={values.labwareType}
          wellBottomShape={values.wellBottomShape}
        />
      </div>
      <div className={styles.form_fields_column}>
        <RadioField
          name="wellBottomShape"
          labelTextClassName={styles.hidden}
          options={wellBottomShapeOptionsWithIcons}
        />
        <TextField name="wellDepth" inputMasks={[maskTo2Decimal]} units="mm" />
      </div>
    </div>
  )
}

export const WellBottomAndDepth = (): JSX.Element | null => {
  const fieldList: Array<keyof LabwareFields> = ['wellBottomShape', 'wellDepth']
  const { values, errors, touched } = useFormikContext<LabwareFields>()

  return (
    <div className={styles.new_definition_section}>
      <SectionBody label="Well Bottom & Depth" id="WellBottomAndDepth">
        <>
          <FormAlerts touched={touched} errors={errors} fieldList={fieldList} />
          <Content values={values} />
        </>
      </SectionBody>
    </div>
  )
}
