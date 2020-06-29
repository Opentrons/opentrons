// @flow
import { FormGroup } from '@opentrons/components'
import * as React from 'react'

import { i18n } from '../../../../localization'
import { TextField } from '../../fields'
import styles from '../../StepEditForm.css'
import type { FocusHandlers } from '../../types'

type Props = {| focusHandlers: FocusHandlers |}

export const ProfileSettings = (props: Props): React.Node => {
  const { focusHandlers } = props

  return (
    <div className={styles.form_row}>
      <FormGroup
        label={i18n.t('form.step_edit_form.field.thermocyclerProfile.volume')}
        className={styles.profile_settings_group}
      >
        <TextField
          name="profileVolume"
          className={styles.small_field}
          units={i18n.t('application.units.microliter')}
          {...focusHandlers}
        />
      </FormGroup>
      <FormGroup
        label={i18n.t('form.step_edit_form.field.thermocyclerProfile.lid_temp')}
        className={styles.profile_settings_group}
      >
        <TextField
          name="profileTargetLidTemp"
          className={styles.small_field}
          units={i18n.t('application.units.degrees')}
          {...focusHandlers}
        />
      </FormGroup>
      <FormGroup
        label={i18n.t(
          'form.step_edit_form.field.thermocyclerProfile.lid_position'
        )}
      >
        <p className={styles.profile_settings_lid}>
          {i18n.t('form.step_edit_form.field.thermocyclerProfile.lid_closed')}
        </p>
      </FormGroup>
    </div>
  )
}
