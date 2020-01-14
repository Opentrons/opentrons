// @flow
import * as React from 'react'
import { FlowRateInput } from './FlowRateInput'
import { connect } from 'react-redux'
import { actions as steplistActions } from '../../../../steplist'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { getDisabledFields } from '../../../../steplist/formLevel'
import type { StepFieldName } from '../../../../steplist/fieldLevel'
import type { BaseState, ThunkDispatch } from '../../../../types'

type Props = {
  ...$Exact<React.ElementProps<typeof FlowRateInput>>,
  innerKey: string,
}

type OP = {|
  name: StepFieldName,
  pipetteFieldName: StepFieldName,
  flowRateType: $PropertyType<Props, 'flowRateType'>,
  label?: $PropertyType<Props, 'label'>,
  className?: string,
|}

type DP = {|
  updateValue: $PropertyType<Props, 'updateValue'>,
|}

type SP = $Rest<$Exact<Props>, {| ...OP, ...DP |}>

// Add a key to force re-constructing component when values change
function FlowRateInputWithKey(props: Props) {
  const { innerKey, ...otherProps } = props
  return <FlowRateInput key={innerKey} {...otherProps} />
}

function mapStateToProps(state: BaseState, ownProps: OP): SP {
  const { flowRateType, pipetteFieldName, name } = ownProps

  const formData = stepFormSelectors.getUnsavedForm(state)

  const pipetteId = formData ? formData[pipetteFieldName] : null
  const pipette =
    pipetteId != null
      ? stepFormSelectors.getPipetteEntities(state)[pipetteId]
      : null
  const pipetteDisplayName = pipette ? pipette.spec.displayName : 'pipette'

  let defaultFlowRate
  if (pipette) {
    if (flowRateType === 'aspirate') {
      defaultFlowRate = pipette.spec.defaultAspirateFlowRate.value
    } else if (flowRateType === 'dispense') {
      defaultFlowRate = pipette.spec.defaultDispenseFlowRate.value
    }
  }

  const formFlowRate = formData && formData[name]

  // force each field to have a new instance created when value is changed
  const innerKey = `${name}:${formFlowRate || 0}`

  return {
    innerKey,
    defaultFlowRate,
    disabled: formData ? getDisabledFields(formData).has(name) : false,
    formFlowRate,
    minFlowRate: 0,
    // NOTE: since we only have rule-of-thumb, max is entire volume in 1 second
    maxFlowRate: pipette ? pipette.spec.maxVolume : Infinity,
    pipetteDisplayName,
  }
}

function mapDispatchToProps(dispatch: ThunkDispatch<*>, ownProps: OP): DP {
  return {
    updateValue: (flowRate: ?number) =>
      dispatch(
        steplistActions.changeFormInput({
          update: {
            [ownProps.name]: flowRate,
          },
        })
      ),
  }
}

export const FlowRateField = connect<Props, OP, SP, DP, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(FlowRateInputWithKey)
