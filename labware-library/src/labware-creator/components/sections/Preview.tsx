import { FormStatus, LabwareFields } from '../../fields'
import styles from '../../styles.css'
import { getLabwareName } from '../../utils'
import { ConditionalLabwareRender } from '../ConditionalLabwareRender'
import { FormLevelErrorAlerts } from '../FormLevelErrorAlerts'
import { SectionBody } from './SectionBody'
import { useFormikContext } from 'formik'
import * as React from 'react'

export const PreviewInstructions = (props: {
  values: LabwareFields
}): JSX.Element => {
  const { values } = props
  return (
    <p className={styles.preview_instructions}>
      Check that the size, spacing, and shape of your{' '}
      {getLabwareName(values, true)} looks correct.
    </p>
  )
}

export const Preview = (): JSX.Element => {
  const _context = useFormikContext<LabwareFields>()
  const { values, errors } = _context
  const status: FormStatus = _context.status

  return (
    <SectionBody label="Check your work" id="CheckYourWork">
      <FormLevelErrorAlerts errors={errors} />
      <div className={styles.preview_labware}>
        <ConditionalLabwareRender definition={status.defaultedDef} />
        <PreviewInstructions values={values} />
      </div>
    </SectionBody>
  )
}
