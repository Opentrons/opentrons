import { useFormikContext } from 'formik'

import styles from '../../styles.module.css'
import { getLabwareName } from '../../utils'
import { ConditionalLabwareRender } from '../ConditionalLabwareRender'
import { FormLevelErrorAlerts } from '../FormLevelErrorAlerts'
import { LabwareSideView } from '../LabwareSideView'
import { SectionBody } from './SectionBody'

import type { FormStatus, LabwareFields } from '../../fields'

export const PreviewInstructions = (props: {
  values: LabwareFields
}): JSX.Element => {
  const { values } = props
  return (
    <p className={styles.preview_instructions}>
      Check that the size, spacing, shape, and height of your{' '}
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
        <div className={styles.preview_views}>
          <div className={styles.preview_view}>
            <p className={styles.preview_view_label}>Top</p>
            <div className={styles.preview_canvas}>
              <ConditionalLabwareRender definition={status.defaultedDef} />
            </div>
          </div>
          <div className={styles.preview_view}>
            <p className={styles.preview_view_label}>Side</p>
            <div className={styles.preview_canvas}>
              <LabwareSideView definition={status.defaultedDef} />
            </div>
          </div>
        </div>
        <PreviewInstructions values={values} />
      </div>
    </SectionBody>
  )
}
