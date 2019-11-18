// @flow
import * as React from 'react'
import { FormGroup, DropdownField } from '@opentrons/components'
import i18n from '../../../localization'

import StepField from '../fields/FieldConnector'
import { ConditionalOnField, TextField } from '../fields'
import styles from '../StepEditForm.css'

import type { FocusHandlers } from '../types'

type MagnetFormProps = { focusHandlers: FocusHandlers }
function MagnetForm(props: MagnetFormProps): React.Element<'div'> {
  const { focusHandlers } = props

  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {i18n.t('application.stepType.magnet')}
        </span>
      </div>

      <div className={styles.section_wrapper}>
        <div className={styles.wrap_group}>
          <div className={styles.section_column}>
            <FormGroup
              label={i18n.t('form.step_edit_form.field.magnetAction.label')}
              className={styles.magnet_form_group}
            >
              <StepField
                dirtyFields={focusHandlers.dirtyFields}
                focusedField={focusHandlers.focusedField}
                name="magnetAction"
                render={({ value, updateValue, errorToShow }) => {
                  const fieldValue = String(value) || null
                  return (
                    <DropdownField
                      name="magnetAction"
                      className={styles.large_field}
                      onChange={(e: SyntheticEvent<HTMLSelectElement>) => {
                        updateValue(e.currentTarget.value)
                      }}
                      value={fieldValue}
                      options={[
                        {
                          name: i18n.t(
                            'form.step_edit_form.field.magnetAction.options.engage'
                          ),
                          value: 'engage',
                        },
                        {
                          name: i18n.t(
                            'form.step_edit_form.field.magnetAction.options.disengage'
                          ),
                          value: 'disengage',
                        },
                      ]}
                    />
                  )
                }}
              />
            </FormGroup>
          </div>
          <div className={styles.section_column}>
            <ConditionalOnField
              name={'magnetAction'}
              condition={val => val === 'engage'}
            >
              <FormGroup
                label={i18n.t('form.step_edit_form.field.engageHeight.label')}
                className={styles.magnet_form_group}
              >
                <TextField
                  name="engageHeight"
                  caption={i18n.t(
                    'form.step_edit_form.field.engageHeight.caption'
                  )}
                  className={styles.small_field}
                  units={i18n.t('application.units.millimeter')}
                  {...focusHandlers}
                />
              </FormGroup>
            </ConditionalOnField>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MagnetForm
