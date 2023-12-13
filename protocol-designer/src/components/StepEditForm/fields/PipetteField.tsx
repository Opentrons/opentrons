import * as React from 'react'
import { connect } from 'react-redux'
import { FormGroup, DropdownField, Options } from '@opentrons/components'
import { i18n } from '../../../localization'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { BaseState } from '../../../types'
import styles from '../StepEditForm.module.css'
import { FieldProps } from '../types'

type OP = FieldProps

interface SP {
  pipetteOptions: Options
}

type Props = OP & SP

const PipetteFieldSTP = (state: BaseState, ownProps: OP): SP => ({
  pipetteOptions: stepFormSelectors.getEquippedPipetteOptions(state),
})

export const PipetteField = connect(PipetteFieldSTP)((props: Props) => {
  const { onFieldBlur, onFieldFocus, updateValue, value } = props

  return (
    <FormGroup
      label={i18n.t('form.step_edit_form.field.pipette.label')}
      className={styles.large_field}
    >
      <DropdownField
        options={props.pipetteOptions}
        name={props.name}
        value={value ? String(value) : null}
        onBlur={onFieldBlur}
        onFocus={onFieldFocus}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          updateValue(e.currentTarget.value)
        }}
      />
    </FormGroup>
  )
})
