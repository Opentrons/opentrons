import * as React from 'react'
import { useFormikContext } from 'formik'
import { LabwareFields, LabwareType } from '../../fields'
import { ConditionalLabwareRender } from '../ConditionalLabwareRender'
import { FormLevelErrorAlerts } from '../FormLevelErrorAlerts'

import { SectionBody } from './SectionBody'

import styles from '../../styles.css'

export const PreviewInstructions = (props: {
  labwareType: LabwareType | null | undefined
}): JSX.Element => {
  const { labwareType } = props
  let labwarePreviewType = ''
  switch (labwareType) {
    case 'tipRack':
      labwarePreviewType = 'tips'
      break
    case 'tubeRack':
      labwarePreviewType = 'tubes'
      break
    default:
      labwarePreviewType = 'wells'
  }
  return (
    <p className={styles.preview_instructions}>
      Check that the size, spacing, and shape of your {labwarePreviewType} looks
      correct.
    </p>
  )
}

export const Preview = (): JSX.Element => {
  const { values, errors } = useFormikContext<LabwareFields>()

  return (
    <SectionBody label="Check your work" id="CheckYourWork">
      <FormLevelErrorAlerts errors={errors} />
      <div className={styles.preview_labware}>
        <ConditionalLabwareRender values={values} />
        <PreviewInstructions labwareType={values.labwareType} />
      </div>
    </SectionBody>
  )
}
