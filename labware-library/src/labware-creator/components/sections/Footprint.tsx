import * as React from 'react'
import { useFormikContext } from 'formik'
import { makeMaskToDecimal } from '../../fieldMasks'
import { LabwareFields } from '../../fields'
import { isEveryFieldHidden } from '../../utils'
import { FormAlerts } from '../alerts/FormAlerts'
import { XYDimensionAlerts } from '../alerts/XYDimensionAlerts'
import { TextField } from '../TextField'
import { SectionBody } from './SectionBody'

import styles from '../../styles.css'

const maskTo2Decimal = makeMaskToDecimal(2)

const Content = (): JSX.Element => (
  <div className={styles.flex_row}>
    <div className={styles.instructions_column}>
      <p>
        Ensure measurement is taken from the <strong>very bottom</strong> of
        plate.
      </p>
      <p>
        The footprint measurement helps determine if the labware fits firmly
        into the slots on the OT-2 deck.
      </p>
    </div>
    <div className={styles.diagram_column}>
      <img
        src={require('../../images/footprint.svg')}
        alt="labware footprint"
      />
    </div>
    <div className={styles.form_fields_column}>
      <TextField
        name="footprintXDimension"
        inputMasks={[maskTo2Decimal]}
        units="mm"
      />
      <TextField
        name="footprintYDimension"
        inputMasks={[maskTo2Decimal]}
        units="mm"
      />
    </div>
  </div>
)

export const Footprint = (): JSX.Element | null => {
  const fieldList: Array<keyof LabwareFields> = [
    'footprintXDimension',
    'footprintYDimension',
  ]
  const { values, errors, touched } = useFormikContext<LabwareFields>()

  if (isEveryFieldHidden(fieldList, values)) {
    return null
  }

  return (
    <div className={styles.new_definition_section}>
      <SectionBody label="Footprint" id="Footprint">
        <>
          <FormAlerts touched={touched} errors={errors} fieldList={fieldList} />
          <XYDimensionAlerts values={values} touched={touched} />
          <Content />
        </>
      </SectionBody>
    </div>
  )
}
