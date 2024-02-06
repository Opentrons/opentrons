import * as React from 'react'
import { useFormikContext } from 'formik'
import capitalize from 'lodash/capitalize'
import { makeMaskToDecimal } from '../../fieldMasks'
import { displayAsTube, getLabwareName } from '../../utils'
import { LabwareFields } from '../../fields'
import { FormAlerts } from '../alerts/FormAlerts'
import { wellShapeOptionsWithIcons } from '../optionsWithImages'
import { TextField } from '../TextField'
import { RadioField } from '../RadioField'
import { WellXYImg } from '../diagrams'
import { SectionBody } from './SectionBody'

import styles from '../../styles.module.css'

const maskTo2Decimal = makeMaskToDecimal(2)

interface Props {
  values: LabwareFields
}

const Instructions = (props: Props): JSX.Element => {
  if (props.values.labwareType === 'tipRack') {
    return (
      <p>
        Reference the <strong>inside</strong> of the tip.
      </p>
    )
  }
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
          <p>
            Diameter helps the robot locate the sides of the{' '}
            {getLabwareName(props.values, true)}.
          </p>
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
  const label =
    values.labwareType === 'tipRack'
      ? 'Tip Diameter'
      : `${capitalize(getLabwareName(values, false))} Shape & Sides`
  const id =
    values.labwareType === 'tipRack' ? 'TipDiameter' : 'WellShapeAndSides'

  return (
    <div className={styles.new_definition_section}>
      <SectionBody label={label} id={id}>
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
