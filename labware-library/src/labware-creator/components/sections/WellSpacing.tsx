import * as React from 'react'
import { useFormikContext } from 'formik'
import { makeMaskToDecimal } from '../../fieldMasks'
import { isEveryFieldHidden } from '../../utils'
import { LabwareFields } from '../../fields'
import { FormAlerts } from '../alerts/FormAlerts'
import { TextField } from '../TextField'
import { XYSpacingImg } from '../diagrams'
import { SectionBody } from './SectionBody'

import styles from '../../styles.css'

const maskTo2Decimal = makeMaskToDecimal(2)

interface Props {
  values: LabwareFields
}

// TODO (ka 2021-5-11): Broke this out here since we will need to have more conditions for tips
const Instructions = (): JSX.Element => {
  return (
    <>
      <p>
        Spacing is between the <strong>center</strong> of wells.
      </p>
      <p>
        Well spacing measurements inform the robot how far away rows and columns
        are from each other.
      </p>
    </>
  )
}

const Content = (props: Props): JSX.Element => {
  const { values } = props
  return (
    <div className={styles.flex_row}>
      <div className={styles.instructions_column}>
        <Instructions />
      </div>
      <div className={styles.diagram_column}>
        <XYSpacingImg
          labwareType={values.labwareType}
          wellShape={values.wellShape}
          gridRows={values.gridRows}
        />
      </div>
      <div className={styles.form_fields_column}>
        <TextField
          name="gridSpacingX"
          inputMasks={[maskTo2Decimal]}
          units="mm"
        />
        <TextField
          name="gridSpacingY"
          inputMasks={[maskTo2Decimal]}
          units="mm"
        />
      </div>
    </div>
  )
}

export const WellSpacing = (): JSX.Element | null => {
  const fieldList: Array<keyof LabwareFields> = ['gridSpacingX', 'gridSpacingY']
  const { values, errors, touched } = useFormikContext<LabwareFields>()
  if (
    isEveryFieldHidden(fieldList, values) ||
    (values.labwareType != null &&
      ['aluminumBlock', 'tubeRack'].includes(values.labwareType))
  ) {
    return null
  }
  return (
    <div className={styles.new_definition_section}>
      <SectionBody label="Well Spacing">
        <>
          <FormAlerts touched={touched} errors={errors} fieldList={fieldList} />
          <Content values={values} />
        </>
      </SectionBody>
    </div>
  )
}
