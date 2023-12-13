import * as React from 'react'

import { i18n } from '../../../../localization'
import { THERMOCYCLER_STATE, THERMOCYCLER_PROFILE } from '../../../../constants'

import { ProfileItemRows, RadioGroupField } from '../../fields'
import { StateFields } from './StateFields'
import { ProfileSettings } from './ProfileSettings'
import styles from '../../StepEditForm.module.css'
import { StepFormProps } from '../../types'

export const ThermocyclerForm = (props: StepFormProps): JSX.Element => {
  const { focusHandlers, propsForFields, formData } = props

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
            {...propsForFields.thermocyclerFormType}
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
        {propsForFields.thermocyclerFormType?.value === THERMOCYCLER_STATE && (
          <StateFields propsForFields={propsForFields} formData={formData} />
        )}
        <div className={styles.checkbox_row}>
          <RadioGroupField
            {...propsForFields.thermocyclerFormType}
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

      {propsForFields.thermocyclerFormType?.value === THERMOCYCLER_PROFILE && (
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
          <ProfileItemRows
            focusHandlers={focusHandlers}
            orderedProfileItems={formData.orderedProfileItems}
            profileItemsById={formData.profileItemsById}
          />
          <div className={styles.section_header}>
            <span className={styles.section_header_text}>
              {i18n.t('application.stepType.ending_hold')}
            </span>
          </div>
          <StateFields
            propsForFields={propsForFields}
            formData={formData}
            isEndingHold
          />
        </div>
      )}
    </div>
  )
}
