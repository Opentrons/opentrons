import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { FormGroup } from '@opentrons/components'
import { TextField } from '../../fields'

import styles from '../../StepEditForm.module.css'

import { FieldPropsByName } from '../../types'

interface Props {
  propsForFields: FieldPropsByName
}

export const ProfileSettings = (props: Props): JSX.Element => {
  const { propsForFields } = props
  const { t } = useTranslation(['form', 'application'])

  return (
    <div className={styles.form_row}>
      <FormGroup
        label={t('step_edit_form.field.thermocyclerProfile.volume')}
        className={styles.profile_settings_group}
      >
        <TextField
          {...propsForFields.profileVolume}
          className={styles.small_field}
          units={t('application:units.microliter')}
        />
      </FormGroup>
      <FormGroup
        label={t('step_edit_form.field.thermocyclerProfile.lid_temp')}
        className={styles.profile_settings_group}
      >
        <TextField
          {...propsForFields.profileTargetLidTemp}
          className={styles.small_field}
          units={t('application:units.degrees')}
        />
      </FormGroup>
      <FormGroup
        label={t('step_edit_form.field.thermocyclerProfile.lid_position')}
      >
        <p className={styles.profile_settings_lid}>
          {t('step_edit_form.field.thermocyclerProfile.lid_closed')}
        </p>
      </FormGroup>
    </div>
  )
}
