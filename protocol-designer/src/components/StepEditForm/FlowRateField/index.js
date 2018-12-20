// @flow
import * as React from 'react'
import FlowRateField from './FlowRateField'
import {connect} from 'react-redux'
import {
  actions as steplistActions,
} from '../../../steplist'
import {selectors as stepFormSelectors} from '../../../step-forms'
import type {StepFieldName} from '../../../steplist/fieldLevel'
import type {BaseState, ThunkDispatch} from '../../../types'

type Props = React.ElementProps<typeof FlowRateField> & {
  innerKey: string,
}

type OP = {
  name: StepFieldName,
  pipetteFieldName: StepFieldName,
  flowRateType: $PropertyType<Props, 'flowRateType'>,
  label?: $PropertyType<Props, 'label'>,
}

type DP = {
  updateValue: $PropertyType<Props, 'updateValue'>,
}

type SP = $Diff<Props, DP>

// Add a key to force re-constructing component when values change
function FlowRateFieldWithKey (props: Props) {
  const {innerKey, ...otherProps} = props
  return <FlowRateField key={innerKey} {...otherProps} />
}

function mapStateToProps (state: BaseState, ownProps: OP): SP {
  const {flowRateType, pipetteFieldName, name} = ownProps

  const formData = stepFormSelectors.getUnsavedForm(state)

  const pipetteId = formData ? formData[pipetteFieldName] : null
  const pipette = (pipetteId != null)
    ? stepFormSelectors.getPipetteInvariantProperties(state)[pipetteId]
    : null
  const pipetteDisplayName = pipette ? pipette.spec.displayName : 'pipette'

  let defaultFlowRate
  if (pipette) {
    if (flowRateType === 'aspirate') {
      defaultFlowRate = pipette.spec.defaultAspirateFlowRate
    } else if (flowRateType === 'dispense') {
      defaultFlowRate = pipette.spec.defaultDispenseFlowRate
    }
  }

  const formFlowRate = formData && formData[name]

  // force each field to have a new instance created when value is changed
  const innerKey = `${name}:${formFlowRate || 0}`

  return {
    innerKey,
    defaultFlowRate,
    disabled: pipetteId == null,
    formFlowRate,
    flowRateType,
    label: ownProps.label,
    minFlowRate: 0,
    // NOTE: since we only have rule-of-thumb, max is entire volume in 1 second
    maxFlowRate: pipette ? pipette.spec.maxVolume : Infinity,
    pipetteDisplayName,
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>, ownProps: OP): DP {
  return {
    updateValue: (flowRate: ?number) => dispatch(
      steplistActions.changeFormInput({
        update: {
          [ownProps.name]: flowRate,
        },
      })
    ),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(FlowRateFieldWithKey)
