import * as React from 'react'
import { useFormikContext } from 'formik'
import { makeMaskToDecimal } from '../../fieldMasks'
import { isEveryFieldHidden, displayAsTube } from '../../utils'
import { LabwareFields } from '../../fields'
import { FormAlerts } from '../alerts/FormAlerts'
import { TextField } from '../TextField'
import { XYOffsetImg, XYOffsetHelperTextImg } from '../diagrams'
import { SectionBody } from './SectionBody'

import styles from '../../styles.css'

const maskTo2Decimal = makeMaskToDecimal(2)

interface Props {
  values: LabwareFields
}

const Instructions = (props: Props): JSX.Element => {
  const { values } = props
  let labwareTypeLocation = 'well A1'
  // NOTE (ka 2021-6-8): this case is not needed till custom tuberacks but adding logic/text in here
  // This section is hidden with opentrons tubracks/alumn blocks at the moment since we know the grid offset already
  if (displayAsTube(values)) {
    labwareTypeLocation = 'tube A1'
  } else if (values.labwareType === 'reservoir') {
    labwareTypeLocation = 'the top left-most well'
  } else if (values.labwareType === 'tipRack') {
    labwareTypeLocation = 'tip A1'
  }
  return (
    <>
      <p>
        Find the measurement from the center of{' '}
        <strong>{labwareTypeLocation}</strong> to the edge of the labware{"'"}s
        footprint.
      </p>
      <p>
        Corner offset informs the robot how far the grid of{' '}
        {/* TODO (ka 2021-6-8): Use Sarah's incoming helper function once custom tuberacks is implemented */}
        {values.labwareType === 'tipRack' ? 'tips' : 'wells'} is from the slot
        {"'"}s top left corner.
      </p>
      <div className={styles.help_text}>
        <XYOffsetHelperTextImg labwareType={values.labwareType} />
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
