import { useTranslation } from 'react-i18next'
import { FormGroup, SPACING } from '@opentrons/components'
import { TextField } from '../../fields'
import type { StepFormProps } from '../../types'

import styles from '../../StepEditForm.module.css'

export function CommentForm(props: StepFormProps): JSX.Element {
  const { t } = useTranslation(['tooltip', 'application', 'form'])

  const { propsForFields } = props

  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {t('application:stepType.comment')}
        </span>
      </div>
      <div
        className={styles.section_wrapper}
        style={{ paddingTop: SPACING.spacing16 }}
      >
        <FormGroup label={t('form:step_edit_form.field.comment.label')}>
          <TextField
            {...propsForFields.message}
            className={styles.large_field}
          />
        </FormGroup>
      </div>
    </div>
  )
}
