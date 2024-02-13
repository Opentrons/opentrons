import * as React from 'react'
import { useFormikContext } from 'formik'
import { makeMaskToDecimal } from '../../fieldMasks'
import { LabwareFields } from '../../fields'
import { isEveryFieldHidden } from '../../utils'
import { FormAlerts } from '../alerts/FormAlerts'
import { XYDimensionAlerts } from '../alerts/XYDimensionAlerts'
import { TextField } from '../TextField'
import { SectionBody } from './SectionBody'
import footprintImage from '../../images/footprint.svg'

import styles from '../../styles.module.css'

const maskTo2Decimal = makeMaskToDecimal(2)

interface ContentProps {
  values: LabwareFields
}
const Content = (props: ContentProps): JSX.Element => {
  const { values } = props

  return (
    <div className={styles.flex_row}>
      <div className={styles.instructions_column}>
        {values.labwareType === 'tipRack' && (
          <p>
            If your Tip Rack has an adapter,{' '}
            <strong>place it in the adapter.</strong>
          </p>
        )}
        <p>
          Ensure measurement is taken from the <strong>very bottom</strong> of
          labware.
        </p>
        <p>
          The footprint measurement helps determine if the labware (in adapter
          if needed) fits firmly into the slots on the OT-2 deck.
        </p>
      </div>
      <div className={styles.diagram_column}>
        <img
          src={footprintImage}
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
}

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
      <SectionBody label="Total Footprint" id="Footprint">
        <>
          <FormAlerts
            values={values}
            touched={touched}
            errors={errors}
            fieldList={fieldList}
          />
          <XYDimensionAlerts values={values} touched={touched} />
          <Content values={values} />
        </>
      </SectionBody>
    </div>
  )
}
