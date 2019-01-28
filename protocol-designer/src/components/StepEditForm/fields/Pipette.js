// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import cx from 'classnames'
import {
  FormGroup,
  DropdownField,
  type DropdownOption,
} from '@opentrons/components'
import {selectors as stepFormSelectors} from '../../../step-forms'
import type {StepFieldName} from '../../../steplist/fieldLevel'
import type {BaseState} from '../../../types'
import type {StepType} from '../../../form-types'
import styles from '../StepEditForm.css'
import type {FocusHandlers} from '../index'
import StepField from './FieldConnector'

type Options = Array<DropdownOption>

type PipetteFieldOP = {name: StepFieldName, stepType?: StepType} & FocusHandlers
type PipetteFieldSP = {pipetteOptions: Options}
type PipetteFieldProps = PipetteFieldOP & PipetteFieldSP
const PipetteFieldSTP = (state: BaseState, ownProps: PipetteFieldOP): PipetteFieldSP => ({
  pipetteOptions: stepFormSelectors.getEquippedPipetteOptions(state),
})
const PipetteField = connect(PipetteFieldSTP)((props: PipetteFieldProps) => (
  <StepField
    name={props.name}
    focusedField={props.focusedField}
    dirtyFields={props.dirtyFields}
    render={({value, updateValue, hoverTooltipHandlers}) => (
      <FormGroup label='Pipette:' className={cx(styles.pipette_field, styles.large_field)} hoverTooltipHandlers={hoverTooltipHandlers}>
        <DropdownField
          options={props.pipetteOptions}
          value={value ? String(value) : null}
          onBlur={() => { props.onFieldBlur(props.name) }}
          onFocus={() => { props.onFieldFocus(props.name) }}
          onChange={(e: SyntheticEvent<HTMLSelectElement>) => {
            updateValue(e.currentTarget.value)
          }} />
      </FormGroup>
    )} />
))

export default PipetteField
