// @flow
import * as React from 'react'

import { i18n } from '../../../../localization'
import { FormGroup } from '@opentrons/components'
import { ConditionalOnField, ToggleRowField, TextField } from '../../fields'

import styles from '../../StepEditForm.css'

import type { FocusHandlers } from '../../types'

type Props = {| focusHandlers: FocusHandlers |}
export const StateFields = (props: Props) => {
  const { focusHandlers } = props
  return (
    <div className={styles.form_row}>
      <FormGroup
        label={i18n.t(
          'form.step_edit_form.field.thermocyclerState.block.label'
        )}
        className={styles.toggle_form_group}
      >
        <div className={styles.toggle_row}>
          <ToggleRowField
            name="blockIsActive"
            labelOff={i18n.t(
              'form.step_edit_form.field.thermocyclerState.block.toggleOff'
            )}
            labelOn={i18n.t(
              'form.step_edit_form.field.thermocyclerState.block.toggleOn'
            )}
          />
          <ConditionalOnField
            name={'blockIsActive'}
            condition={val => val === true}
          >
            <TextField
              name="blockTargetTemp"
              className={styles.small_field}
              units={i18n.t('application.units.degrees')}
              {...focusHandlers}
            />
          </ConditionalOnField>
        </div>
      </FormGroup>

      <FormGroup
        label={i18n.t('form.step_edit_form.field.thermocyclerState.lid.label')}
        className={styles.toggle_form_group}
      >
        <div className={styles.toggle_row}>
          <ToggleRowField
            name="lidIsActive"
            labelOff={i18n.t(
              'form.step_edit_form.field.thermocyclerState.lid.toggleOff'
            )}
            labelOn={i18n.t(
              'form.step_edit_form.field.thermocyclerState.lid.toggleOn'
            )}
          />
          <ConditionalOnField
            name={'lidIsActive'}
            condition={val => val === true}
          >
            <TextField
              name="lidTargetTemp"
              className={styles.small_field}
              units={i18n.t('application.units.degrees')}
              {...focusHandlers}
            />
          </ConditionalOnField>
        </div>
      </FormGroup>

      <FormGroup
        label={i18n.t(
          'form.step_edit_form.field.thermocyclerState.lidPosition.label'
        )}
        className={styles.toggle_form_group}
      >
        <ToggleRowField
          name="lidOpen"
          labelOff={i18n.t(
            'form.step_edit_form.field.thermocyclerState.lidPosition.toggleOff'
          )}
          labelOn={i18n.t(
            'form.step_edit_form.field.thermocyclerState.lidPosition.toggleOn'
          )}
        />
      </FormGroup>
    </div>
  )
}
