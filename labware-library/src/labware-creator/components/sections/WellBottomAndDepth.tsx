import * as React from 'react'
import capitalize from 'lodash/capitalize'
import { useFormikContext } from 'formik'
import { makeMaskToDecimal } from '../../fieldMasks'
import { LabwareFields } from '../../fields'
import { FormAlerts } from '../alerts/FormAlerts'
import { TextField } from '../TextField'
import { RadioField } from '../RadioField'
import { DepthImg } from '../diagrams'
import { SectionBody } from './SectionBody'
import { wellBottomShapeOptionsWithIcons } from '../optionsWithImages'

import styles from '../../styles.module.css'
import { getLabwareName } from '../../utils'

const maskTo2Decimal = makeMaskToDecimal(2)

interface Props {
  values: LabwareFields
}

// TODO (ka 2021-5-7): Broke this out here since we will need to have more conditions for tips
const Instructions = (props: Props): JSX.Element => {
  const { values } = props
  if (values.labwareType === 'tipRack') {
    return <p>Reference the top of the tip to the bottom of the tip.</p>
  }

  const labwareName = getLabwareName(values, false)
  return (
    <>
      <p>
        Reference the measurement from the top of the {labwareName} (include any
        lip but exclude any cap) to the bottom of the <strong>inside</strong> of
        the {labwareName}.
      </p>

      <p>
        Depth informs the robot how far down it can go inside a {labwareName}.
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
        <TextField
          label={values.labwareType === 'tipRack' ? 'Length' : undefined}
          name="wellDepth"
          inputMasks={[maskTo2Decimal]}
          units="mm"
        />
      </div>
    </div>
  )
}

export const WellBottomAndDepth = (): JSX.Element | null => {
  const fieldList: Array<keyof LabwareFields> = ['wellBottomShape', 'wellDepth']
  const { values, errors, touched } = useFormikContext<LabwareFields>()
  const label =
    values.labwareType === 'tipRack'
      ? 'Tip Length'
      : `${capitalize(getLabwareName(values, false))} Bottom & Depth`
  return (
    <div className={styles.new_definition_section}>
      <SectionBody label={label} id="WellBottomAndDepth">
        <>
          <FormAlerts
            values={values}
            touched={touched}
            errors={errors}
            fieldList={fieldList}
          />
          <Content values={values} />
        </>
      </SectionBody>
    </div>
  )
}
