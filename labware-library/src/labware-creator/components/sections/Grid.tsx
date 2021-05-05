import * as React from 'react'
import { useFormikContext } from 'formik'
import { maskToInteger } from '../../fieldMasks'
import { isEveryFieldHidden } from '../../utils'
import { LabwareFields, yesNoOptions } from '../../fields'
import { FormAlerts } from '../FormAlerts'
import { TextField } from '../TextField'
import { RadioField } from '../RadioField'
import { GridImg } from '../diagrams'
import { SectionBody } from './SectionBody'

import styles from '../../styles.css'

const Content = (): JSX.Element => {
  return (
    <div className={styles.flex_row}>
      <div className={styles.instructions_column}>
        <p>
          The grid of wells on your labware is arranged via rows and columns.
          Rows run horizontally across your labware (left to right). Columns run
          top to bottom.
        </p>
      </div>
      <div className={styles.diagram_column}>
        <GridImg />
      </div>
      <div className={styles.form_fields_column}>
        <TextField name="gridRows" inputMasks={[maskToInteger]} />
        <RadioField name="regularRowSpacing" options={yesNoOptions} />
        <TextField name="gridColumns" inputMasks={[maskToInteger]} />
        <RadioField name="regularColumnSpacing" options={yesNoOptions} />
      </div>
    </div>
  )
}

export const Grid = (): JSX.Element | null => {
  const fieldList: Array<keyof LabwareFields> = [
    'gridRows',
    'gridColumns',
    'regularRowSpacing',
    'regularColumnSpacing',
  ]
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
      <SectionBody label="Grid">
        <>
          <FormAlerts touched={touched} errors={errors} fieldList={fieldList} />
          <Content />
        </>
      </SectionBody>
    </div>
  )
}
