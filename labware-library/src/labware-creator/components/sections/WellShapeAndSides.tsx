import * as React from 'react'
import { useFormikContext } from 'formik'
import { makeMaskToDecimal } from '../../fieldMasks'
import { displayAsTube } from '../../utils'
import { LabwareFields } from '../../fields'
import { FormAlerts } from '../alerts/FormAlerts'
import { wellShapeOptionsWithIcons } from '../optionsWithImages'
import { TextField } from '../TextField'
import { RadioField } from '../RadioField'
import { WellXYImg } from '../diagrams'
import { SectionBody } from './SectionBody'

import styles from '../../styles.css'

const maskTo2Decimal = makeMaskToDecimal(2)

interface Props {
  values: LabwareFields
}

// TODO (ka 2021-5-7): Broke this out here since we will need to have more conditions for tips
const Instructions = (props: Props): JSX.Element => {
  return (
    <>
      {displayAsTube(props.values) ? (
        <>
          <p>
            Reference the <strong>top</strong> of the <strong>inside</strong> of
            the tube. Ignore any lip.
          </p>
          <p>
            Diameter helps the robot locate the sides of the tubes. If there are
            multiple measurements for this dimension then use the smaller one.
          </p>
        </>
      ) : (
        <>
          <p>
            Reference the <strong>inside</strong> of the well. Ignore any lip.
          </p>
          <p>Diameter helps the robot locate the sides of the wells.</p>
        </>
      )}
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
        <WellXYImg wellShape={values.wellShape} />
      </div>
      <div className={styles.form_fields_column}>
        <RadioField
          name="wellShape"
          labelTextClassName={styles.hidden}
          options={wellShapeOptionsWithIcons}
        />
        {values.wellShape === 'rectangular' ? (
          <>
            <TextField
              name="wellXDimension"
              inputMasks={[maskTo2Decimal]}
              units="mm"
            />
            <TextField
              name="wellYDimension"
              inputMasks={[maskTo2Decimal]}
              units="mm"
            />
          </>
        ) : (
          <TextField
            name="wellDiameter"
            inputMasks={[maskTo2Decimal]}
            units="mm"
          />
        )}
      </div>
    </div>
  )
}

export const WellShapeAndSides = (): JSX.Element | null => {
  const fieldList: Array<keyof LabwareFields> = [
    'wellShape',
    'wellDiameter',
    'wellXDimension',
    'wellYDimension',
  ]
  const { values, errors, touched } = useFormikContext<LabwareFields>()

  return (
    <div className={styles.new_definition_section}>
      <SectionBody label="Well Shape & Sides">
        <>
          <FormAlerts touched={touched} errors={errors} fieldList={fieldList} />
          <Content values={values} />
        </>
      </SectionBody>
    </div>
  )
}
