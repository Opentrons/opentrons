import * as React from 'react'
import { useFormikContext } from 'formik'
import { makeMaskToDecimal } from '../../fieldMasks'
import { isEveryFieldHidden } from '../../utils'
import { LabwareFields } from '../../fields'
import { FormAlerts } from '../alerts/FormAlerts'
import { TextField } from '../TextField'
import { XYOffsetImg } from '../diagrams'
import { SectionBody } from './SectionBody'

import styles from '../../styles.css'

const maskTo2Decimal = makeMaskToDecimal(2)

interface Props {
  values: LabwareFields
}

// TODO (ka 2021-5-11): Broke this out here since we will need to have more conditions for tips
const Instructions = (props: Props): JSX.Element => {
  const { values } = props
  return (
    <>
      <p>
        Find the measurement from the center of{' '}
        <strong>
          {values.labwareType === 'reservoir'
            ? 'the top left-most well'
            : 'well A1'}
        </strong>{' '}
        to the edge of the labware{"'"}s footprint.
      </p>
      <p>
        Corner offset informs the robot how far the grid of wells is from the
        slot{"'"}s top left corner.
      </p>
      <div className={styles.help_text}>
        <img src={require('../../images/offset_helpText.svg')} />
      </div>
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
        <XYOffsetImg
          labwareType={values.labwareType}
          wellShape={values.wellShape}
        />
      </div>
      <div className={styles.form_fields_column}>
        <TextField
          name="gridOffsetX"
          inputMasks={[maskTo2Decimal]}
          units="mm"
        />
        <TextField
          name="gridOffsetY"
          inputMasks={[maskTo2Decimal]}
          units="mm"
        />
      </div>
    </div>
  )
}

export const GridOffset = (): JSX.Element | null => {
  const fieldList: Array<keyof LabwareFields> = ['gridOffsetX', 'gridOffsetY']
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
      <SectionBody label="Grid Offset" id="GridOffset">
        <>
          <FormAlerts touched={touched} errors={errors} fieldList={fieldList} />
          <Content values={values} />
        </>
      </SectionBody>
    </div>
  )
}
