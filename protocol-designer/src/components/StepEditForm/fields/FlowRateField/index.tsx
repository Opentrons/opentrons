import * as React from 'react'
import { FlowRateInput, FlowRateInputProps } from './FlowRateInput'
import { connect } from 'react-redux'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { FieldProps } from '../../types'
import { BaseState } from '../../../../types'

interface OP extends FieldProps {
  pipetteId?: string | null
  className?: FlowRateInputProps['className']
  flowRateType: FlowRateInputProps['flowRateType']
  label?: FlowRateInputProps['label']
}

interface SP {
  innerKey: string
  defaultFlowRate?: number | null
  minFlowRate: number
  maxFlowRate: number
  pipetteDisplayName: string
}

interface Props extends FlowRateInputProps {
  innerKey: string
}

// Add a key to force re-constructing component when values change
function FlowRateInputWithKey(props: Props): JSX.Element {
  const { innerKey, ...otherProps } = props
  return <FlowRateInput key={innerKey} {...otherProps} />
}

function mapStateToProps(state: BaseState, ownProps: OP): SP {
  const { flowRateType, pipetteId, name } = ownProps

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

  // force each field to have a new instance created when value is changed
  const innerKey = `${name}:${String(ownProps.value || 0)}`

  return {
    innerKey,
    defaultFlowRate,
    minFlowRate: 0,
    // NOTE: since we only have rule-of-thumb, max is entire volume in 1 second
    maxFlowRate: pipette ? pipette.spec.maxVolume : Infinity,
    pipetteDisplayName,
  }
}

const mergeProps = (
  stateProps: SP,
  _dispatchProps: null,
  ownProps: OP
): Props => {
  const { pipetteId, ...passThruProps } = ownProps
  return { ...stateProps, ...passThruProps }
}

export const FlowRateField = connect(
  mapStateToProps,
  null,
  mergeProps
)(FlowRateInputWithKey)
