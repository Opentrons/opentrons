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
  const { isEndingHold, propsForFields, formData } = props

  // Append 'Hold' to field names if component is used for an ending hold in a TC profile
  const tempActiveName = isEndingHold ? 'tempIsActiveHold' : 'tempIsActive'
  const tempName = isEndingHold ? 'targetTempHold' : 'targetTemp'
  const shakeActiveName = isEndingHold ? 'shakeIsActiveHold' : 'shakeIsActive'
  const shakeName = isEndingHold ? 'targetShakeHold' : 'targetShake'
  const LatchOpenName = isEndingHold ? 'latchOpenHold' : 'latchOpen'

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
            {...propsForFields[tempActiveName]}
            offLabel={i18n.t(
              'form.step_edit_form.field.heaterShakerState.temperature.toggleOff'
            )}
            onLabel={i18n.t(
              'form.step_edit_form.field.heakerShakerState.temperature.toggleOn'
            )}
          />
          {formData[tempActiveName] === true && (
            <TextField
              {...propsForFields[tempName]}
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
          'form.step_edit_form.field.heaterShakerState.shaker.setShaker'
        )}
        className={styles.toggle_form_group}
      >
        <div className={styles.toggle_row}>
          <ToggleRowField
            {...propsForFields[shakeActiveName]}
            offLabel={i18n.t(
              'form.step_edit_form.field.heaterShakerState.shaker.toggleOff'
            )}
            onLabel={i18n.t(
              'form.step_edit_form.field.heaterShakerState.shaker.toggleOn'
            )}
          />
          {formData[shakeActiveName] === true && (
            <TextField
              {...propsForFields[shakeName]}
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
          {...propsForFields[LatchOpenName]}
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
