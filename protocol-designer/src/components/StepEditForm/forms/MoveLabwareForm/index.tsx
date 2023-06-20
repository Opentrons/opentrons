import * as React from 'react'
import { FormGroup } from '@opentrons/components'
import { i18n } from '../../../../localization'
import {
  LabwareField,
  ToggleRowField,
  LabwareLocationField,
} from '../../fields'
import styles from '../../StepEditForm.css'
import type { StepFormProps } from '../../types'

export const MoveLabwareForm = (props: StepFormProps): JSX.Element => {
  const { propsForFields } = props

  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {i18n.t('application.stepType.moveLabware')}
        </span>
      </div>
      <div className={styles.form_row}>
        <FormGroup
          label={i18n.t('form.step_edit_form.labwareLabel.movedLabware')}
          className={styles.large_field}
        >
          <LabwareField {...propsForFields.labware} />
        </FormGroup>
        <FormGroup
          className={styles.small_field}
          label={i18n.t('form.step_edit_form.field.useGripper.label')}
        >
          <ToggleRowField
            {...propsForFields.useGripper}
            offLabel={i18n.t('form.step_edit_form.field.useGripper.toggleOff')}
            onLabel={i18n.t('form.step_edit_form.field.useGripper.toggleOn')}
          />
        </FormGroup>
      </div>
      <div className={styles.form_row}>
        <FormGroup
          className={styles.small_field}
          label={i18n.t('form.step_edit_form.field.newLocation.label')}
        >
          <LabwareLocationField {...propsForFields.newLocation} />
        </FormGroup>
      </div>

      <div className={styles.section_wrapper}></div>
    </div>
  )
}
