// @flow
import * as React from 'react'
import cx from 'classnames'

import { i18n } from '../../../../localization'
import {
  THERMOCYCLER_STATE,
  THERMOCYCLER_PROFILE,
} from '../../../../constants.js'

import { RadioGroupField, ConditionalOnField } from '../../fields'
import { StateFields } from './StateFields'
import styles from '../../StepEditForm.css'

import type { FormData } from '../../../../form-types'
import type { FocusHandlers } from '../../types'

type TCFormProps = {| focusHandlers: FocusHandlers, formData: FormData |}

export const ThermocyclerForm = (props: TCFormProps): React.Element<'div'> => {
  const { focusHandlers } = props
  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {i18n.t('application.stepType.thermocycler')}
        </span>
      </div>
      <div className={styles.tc_step_group}>
        <RadioGroupField
          name="thermocyclerFormType"
          className={styles.tc_step_option}
          options={[
            {
              name: i18n.t(
                'form.step_edit_form.field.thermocyclerAction.options.state'
              ),
              value: THERMOCYCLER_STATE,
            },
          ]}
          {...focusHandlers}
        />
        <ConditionalOnField
          name={'thermocyclerFormType'}
          condition={val => val === THERMOCYCLER_STATE}
        >
          <StateFields focusHandlers={focusHandlers} />
        </ConditionalOnField>

        <RadioGroupField
          name="thermocyclerFormType"
          className={cx(styles.tc_step_option, styles.disabled)}
          options={[
            {
              name: i18n.t(
                'form.step_edit_form.field.thermocyclerAction.options.profile'
              ),
              value: THERMOCYCLER_PROFILE,
            },
          ]}
          {...focusHandlers}
        />
      </div>
    </div>
  )
}
