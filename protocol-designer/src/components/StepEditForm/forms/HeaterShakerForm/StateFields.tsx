import * as React from 'react'
import cx from 'classnames'

import { i18n } from '../../../../localization'
import { FormGroup } from '@opentrons/components'
import { ToggleRowField, TextField } from '../../fields'
import styles from '../../StepEditForm.css'

import { FieldPropsByName } from '../../types'
import { FormData } from '../../../../form-types'

interface Props {
  propsForFields: FieldPropsByName
  isEndingHold?: boolean
  formData: FormData
}

export const StateFields = (props: Props): JSX.Element => {
  const { propsForFields, formData } = props

  return (
    <div className={styles.form_row}>
      <FormGroup
        label={i18n.t(
          'form.step_edit_form.field.heaterShakerState.temperature.setTemperature'
        )}
        className={styles.toggle_form_group}
      >
        <div className={styles.toggle_row}>
          <ToggleRowField
            {...propsForFields.setTemperature}
            offLabel={i18n.t(
              'form.step_edit_form.field.heaterShakerState.temperature.toggleOff'
            )}
            onLabel={i18n.t(
              'form.step_edit_form.field.heakerShakerState.temperature.toggleOn'
            )}
          />
          {formData.setTemperature === true && (
            <TextField
              {...propsForFields.targetHeaterShakerTemperature}
              className={cx(
                styles.small_field,
                styles.toggle_temperature_field
              )}
              units={i18n.t('application.units.degrees')}
            />
          )}
        </div>
      </FormGroup>

      <FormGroup
        label={i18n.t(
          'form.step_edit_form.field.heaterShakerState.shaker.setShake'
        )}
        className={styles.toggle_form_group}
      >
        <div className={styles.toggle_row}>
          <ToggleRowField
            {...propsForFields.setShake}
            offLabel={i18n.t(
              'form.step_edit_form.field.heaterShakerState.shaker.toggleOff'
            )}
            onLabel={i18n.t(
              'form.step_edit_form.field.heaterShakerState.shaker.toggleOn'
            )}
          />
          {formData.setShake === true && (
            <TextField
              {...propsForFields.targetSpeed}
              className={cx(
                styles.small_field,
                styles.toggle_temperature_field
              )}
              units={i18n.t('application.units.rpm')}
            />
          )}
        </div>
      </FormGroup>

      <FormGroup
        label={i18n.t(
          'form.step_edit_form.field.heaterShakerState.latch.setLatch'
        )}
        className={styles.toggle_form_group}
      >
        <ToggleRowField
          {...propsForFields.latchOpen}
          offLabel={i18n.t(
            'form.step_edit_form.field.heaterShakerState.latch.toggleOff'
          )}
          onLabel={i18n.t(
            'form.step_edit_form.field.heaterShakerState.latch.toggleOn'
          )}
        />
      </FormGroup>
    </div>
  )
}
