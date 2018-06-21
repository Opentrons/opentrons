// @flow
import {connect} from 'react-redux'

import {actions, selectors} from '../../steplist'
import {getFieldErrors, processField, type StepFieldName} from '../../steplist/fieldLevel'
import type {FieldError} from '../../steplist/fieldLevel/errors'
import type {BaseState, ThunkDispatch} from '../../types'

type FieldRenderProps = {
  value: string,
  updateValue: (mixed) => void,
  errorsToShow: Array<FieldError>
}
type OP = {
  name: StepFieldName,
  render: (FieldRenderProps) => any, // TODO: type StepField
  dirtyFields?: Array<StepFieldName>,
  focusedField?: StepFieldName
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
  return <React.Fragment>{render({value, updateValue, errorsToShow: showErrors ? errors : null})}</React.Fragment> // NOTE: fragment for flow
}

type ShowFieldErrorParams = {name: StepFieldName, focusedField: StepFieldName, dirtyFields: Array<StepFieldName>}
export const showFieldErrors = ({name, focusedField, dirtyFields}: ShowFieldErrorParams) => (
  !(name === focusedField) && dirtyFields && dirtyFields.includes(name)
)

const STP = (state: BaseState, ownProps: OP): SP => {
  const formData = selectors.getUnsavedForm(state)
  return { value: formData ? formData[ownProps.name] : '' }
}

const DTP = (dispatch: ThunkDispatch<*>, ownProps: OP): DP => ({
  updateValue: (value: mixed) => {
    const processedValue = processField(ownProps.name, value)
    dispatch(actions.changeFormInput({update: {[ownProps.name]: processedValue}}))
  }
})

const ConnectedStepField = connect(STP, DTP)(StepField)

export default ConnectedStepField
