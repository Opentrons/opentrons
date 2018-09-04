// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {actions, selectors} from '../../steplist'
import {getFieldErrors, processField, type StepFieldName} from '../../steplist/fieldLevel'
import getTooltipForField from './getTooltipForField'
import {HoverTooltip, type HoverTooltipHandlers} from '@opentrons/components'
import type {BaseState, ThunkDispatch} from '../../types'

type FieldRenderProps = {
  value: ?mixed,
  updateValue: (?mixed) => void,
  errorToShow: ?string,
  hoverTooltipHandlers?: ?HoverTooltipHandlers
}
type OP = {
  name: StepFieldName,
  render: (FieldRenderProps) => React.Node, // TODO: type StepField
  dirtyFields?: Array<StepFieldName>,
  focusedField?: StepFieldName,
  tooltipComponent?: React.Node
}
type SP = {value?: ?mixed, stepType: ?string}
type DP = {updateValue: (?mixed) => void}
type StepFieldProps = OP & SP & DP

const StepField = (props: StepFieldProps) => {
  const {
    name,
    render,
    stepType,
    value,
    updateValue,
    focusedField,
    dirtyFields
  } = props
  const showErrors = showFieldErrors({name, focusedField, dirtyFields})
  const errors = getFieldErrors(name, value)
  const errorToShow = (showErrors && errors.length > 0) ? errors.join(', ') : null

  const tooltipComponent = props.tooltipComponent || getTooltipForField(stepType, name)

  if (!tooltipComponent) return render({value, updateValue, errorToShow})

  return (
    <HoverTooltip tooltipComponent={tooltipComponent} placement='top'>
      {(hoverTooltipHandlers) =>
        render({value, updateValue, errorToShow, hoverTooltipHandlers})}
    </HoverTooltip>
  )
}

type ShowFieldErrorParams = {name: StepFieldName, focusedField?: StepFieldName, dirtyFields?: Array<StepFieldName>}
export const showFieldErrors = ({name, focusedField, dirtyFields}: ShowFieldErrorParams) => (
  !(name === focusedField) && dirtyFields && dirtyFields.includes(name)
)

const STP = (state: BaseState, ownProps: OP): SP => {
  const formData = selectors.getUnsavedForm(state)
  return {
    value: formData ? formData[ownProps.name] : null,
    stepType: formData ? formData.stepType : null
  }
}

const DTP = (dispatch: ThunkDispatch<*>, ownProps: OP): DP => ({
  updateValue: (value: mixed) => {
    const processedValue = processField(ownProps.name, value)
    dispatch(actions.changeFormInput({update: {[ownProps.name]: processedValue}}))
  }
})

const ConnectedStepField = connect(STP, DTP)(StepField)

export default ConnectedStepField
