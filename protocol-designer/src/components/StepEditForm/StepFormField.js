// @flow
import {connect} from 'react-redux'

import {actions, selectors, getFieldErrors, processField} from '../../steplist' // TODO use steplist/index.js
import type {BaseState, ThunkDispatch} from '../../types'

type FieldRenderProps = {
  value: string,
  updateValue: (mixed) => void,
  errorsToShow: {[string]: string} // TODO: real field errors type
}
type OP = {
  name: string, // TODO: real type
  render: (FieldRenderProps) => StepField,
  dirtyFields?: Array<string>, // TODO: real type
  focusedField?: string // TODO: real type
}
type SP = {value: mixed}
type DP = {updateValue: (e: SyntheticInputEvent<*>) => mixed}
type StepFieldProps = OP & SP & DP

const StepField = (props): StepFieldProps => {
  const {
    name,
    render,
    value,
    updateValue,
    focusedField,
    dirtyFields
  } = props
  const showErrors = showFieldErrors({name, focusedField, dirtyFields})
  const errors = getFieldErrors(name, value)
  return render({value, updateValue, errorsToShow: showErrors && errors})
}

type ShowFieldErrorParams = {name: StepFieldName, focusedField: StepFieldName, dirtyFields: Array<StepFieldName>}
export const showFieldErrors = ({name, focusedField, dirtyFields}: ShowFieldErrorParams) => (
  focusedField && !(name === focusedField) && dirtyFields && dirtyFields.includes(name)
)

const STP = (state: BaseState, ownProps: OP): SP => ({
  value: selectors.formData(state)[ownProps.name] || ''
})

const DTP = (dispatch: ThunkDispatch<*>, ownProps: OP): DP => ({
  updateValue: (value: mixed) => {
    const processedValue = processField(ownProps.name, value)
    dispatch(actions.changeFormInput({update: {[ownProps.name]: processedValue}}))
  }
})

const ConnectedStepField = connect(STP, DTP)(StepField)

export default ConnectedStepField
