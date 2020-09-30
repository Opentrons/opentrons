// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { HoverTooltip, type HoverTooltipHandlers } from '@opentrons/components'
import { actions } from '../../../steplist'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { getFieldErrors, maskField } from '../../../steplist/fieldLevel'
import { getDisabledFields } from '../../../steplist/formLevel'
import type { BaseState, ThunkDispatch } from '../../../types'
import type { StepFieldName } from '../../../form-types'
import { getTooltipForField } from '../utils'

type FieldRenderProps = {
  value: ?mixed,
  updateValue: (?mixed) => void,
  errorToShow: ?string,
  hoverTooltipHandlers?: ?HoverTooltipHandlers,
  disabled: boolean,
}

type OP = {
  name: StepFieldName,
  render: FieldRenderProps => React.Node, // TODO: type StepField
  dirtyFields?: Array<StepFieldName>,
  focusedField?: StepFieldName,
  tooltipComponent?: React.Node,
}

type SP = {| value?: ?mixed, stepType: ?string, disabled: boolean |}

type DP = {| updateValue: (?mixed) => void |}

type StepFieldProps = { ...$Exact<OP>, ...SP, ...DP }

const FieldConnectorComponent = (props: StepFieldProps) => {
  const {
    name,
    render,
    stepType,
    value,
    updateValue,
    focusedField,
    dirtyFields,
    disabled,
  } = props
  const showErrors = showFieldErrors({ name, focusedField, dirtyFields })
  const errors = getFieldErrors(name, value)
  const errorToShow = showErrors && errors.length > 0 ? errors.join(', ') : null

  const tooltipComponent =
    props.tooltipComponent || getTooltipForField(stepType, name, disabled)

  if (!tooltipComponent)
    return render({ value, updateValue, errorToShow, disabled })

  return (
    <HoverTooltip tooltipComponent={tooltipComponent} placement="top">
      {hoverTooltipHandlers =>
        render({
          value,
          updateValue,
          errorToShow,
          hoverTooltipHandlers,
          disabled,
        })
      }
    </HoverTooltip>
  )
}

type ShowFieldErrorParams = {
  name: StepFieldName,
  focusedField?: StepFieldName,
  dirtyFields?: Array<StepFieldName>,
}
export const showFieldErrors = ({
  name,
  focusedField,
  dirtyFields,
}: ShowFieldErrorParams): boolean | void | Array<StepFieldName> =>
  !(name === focusedField) && dirtyFields && dirtyFields.includes(name)

const STP = (state: BaseState, ownProps: OP): SP => {
  const formData = stepFormSelectors.getUnsavedForm(state)
  return {
    value: formData ? formData[ownProps.name] : null,
    stepType: formData ? formData.stepType : null,
    disabled: formData ? getDisabledFields(formData).has(ownProps.name) : false,
  }
}

const DTP = (dispatch: ThunkDispatch<*>, ownProps: OP): DP => ({
  updateValue: (value: mixed) => {
    const maskedValue = maskField(ownProps.name, value)
    dispatch(
      actions.changeFormInput({ update: { [ownProps.name]: maskedValue } })
    )
  },
})

export const FieldConnector: React.AbstractComponent<$Exact<OP>> = connect<
  StepFieldProps,
  $Exact<OP>,
  SP,
  DP,
  _,
  _
>(
  STP,
  DTP
)(FieldConnectorComponent)
