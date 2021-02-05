// @flow
import * as React from 'react'

import { i18n } from '../../../../localization'
import {
  THERMOCYCLER_STATE,
  THERMOCYCLER_PROFILE,
} from '../../../../constants.js'

import {
  ConditionalOnField,
  ProfileItemRows,
  RadioGroupField,
} from '../../fields'
import { StateFields } from './StateFields'
import { ProfileSettings } from './ProfileSettings'
import styles from '../../StepEditForm.css'
import type { StepFormProps } from '../../types'

export const ThermocyclerForm = (props: StepFormProps): React.Node => {
  const { focusHandlers, propsForFields } = props

  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {i18n.t('application.stepType.thermocycler')}
        </span>
      </div>
      <div className={styles.tc_step_group}>
        <div className={styles.checkbox_row}>
          <RadioGroupField
            {...propsForFields['thermocyclerFormType']}
            className={styles.tc_step_option}
            options={[
              {
                name: i18n.t(
                  'form.step_edit_form.field.thermocyclerAction.options.state'
                ),
                value: THERMOCYCLER_STATE,
              },
            ]}
          />
        </div>
        <ConditionalOnField
          name={'thermocyclerFormType'}
          condition={val => val === THERMOCYCLER_STATE}
        >
          <StateFields propsForFields={propsForFields} />
        </ConditionalOnField>
        <div className={styles.checkbox_row}>
          <RadioGroupField
            {...propsForFields['thermocyclerFormType']}
            className={styles.tc_step_option}
            options={[
              {
                name: i18n.t(
                  'form.step_edit_form.field.thermocyclerAction.options.profile'
                ),
                value: THERMOCYCLER_PROFILE,
              },
            ]}
          />
        </div>
      </div>

      <ConditionalOnField
        name={'thermocyclerFormType'}
        condition={val => val === THERMOCYCLER_PROFILE}
      >
        <div className={styles.profile_form}>
          <div className={styles.section_header}>
            <span className={styles.section_header_text}>
              {i18n.t('application.stepType.profile_settings')}
            </span>
          </div>
          <ProfileSettings propsForFields={propsForFields} />
          <div className={styles.section_header}>
            <span className={styles.section_header_text}>
              {i18n.t('application.stepType.profile_steps')}
            </span>
          </div>
          {/* TODO IMMEDIATELY: confirm this use of focusHandlers works and is tested */}
          <ProfileItemRows focusHandlers={focusHandlers} />
          <div className={styles.section_header}>
            <span className={styles.section_header_text}>
              {i18n.t('application.stepType.ending_hold')}
            </span>
          </div>
          <StateFields propsForFields={propsForFields} isEndingHold />
        </div>
      </ConditionalOnField>
    </div>
  )
}
