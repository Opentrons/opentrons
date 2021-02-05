// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { FormGroup, DropdownField, type Options } from '@opentrons/components'
import { i18n } from '../../../localization'
import { selectors as stepFormSelectors } from '../../../step-forms'
import type { BaseState } from '../../../types'
import styles from '../StepEditForm.css'
import type { FieldProps } from '../types'

type OP = {|
  ...FieldProps,
|}

type SP = {| pipetteOptions: Options |}

type Props = { ...OP, ...SP }

const PipetteFieldSTP = (state: BaseState, ownProps: OP): SP => ({
  pipetteOptions: stepFormSelectors.getEquippedPipetteOptions(state),
})

export const PipetteField: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  _,
  _,
  _
>(PipetteFieldSTP)((props: Props) => {
  const { onFieldBlur, onFieldFocus, updateValue, value } = props

  return (
    <FormGroup
      label={i18n.t('form.step_edit_form.field.pipette.label')}
      className={styles.large_field}
    >
      <DropdownField
        options={props.pipetteOptions}
        value={value ? String(value) : null}
        onBlur={onFieldBlur}
        onFocus={onFieldFocus}
        onChange={(e: SyntheticEvent<HTMLSelectElement>) => {
          updateValue(e.currentTarget.value)
        }}
      />
    </FormGroup>
  )
})
