// @flow
import * as React from 'react'
import FlowRateField from './FlowRateField'
import {connect} from 'react-redux'
import {getPipette} from '@opentrons/shared-data'
import {selectors as pipetteSelectors} from '../../../pipettes'
import {
  actions as steplistActions,
  selectors as steplistSelectors
} from '../../../steplist'
import type {StepFieldName} from '../../../steplist/fieldLevel'
import type {BaseState, ThunkDispatch} from '../../../types'

type Props = React.ElementProps<typeof FlowRateField> & {
  innerKey: string
}

type OP = {
  name: StepFieldName,
  pipetteFieldName: StepFieldName,
  flowRateType: $PropertyType<Props, 'flowRateType'>
}

type DP = {
  updateValue: $PropertyType<Props, 'updateValue'>
}

type SP = $Diff<Props, DP>

// Add a key to force re-constructing component when values change
function FlowRateFieldWithKey (props: Props) {
  const {innerKey, ...otherProps} = props
  return <FlowRateField key={innerKey} {...otherProps} />
}

function mapStateToProps (state: BaseState, ownProps: OP): SP {
  const {flowRateType, pipetteFieldName, name} = ownProps

  const formData = steplistSelectors.getUnsavedForm(state)

  const pipetteId = formData ? formData[pipetteFieldName] : null
  const pipette = pipetteId && pipetteSelectors.pipettesById(state)[pipetteId]
  const pipetteConfig = pipette && getPipette(pipette.model)
  const pipetteModelDisplayName = pipetteConfig ? pipetteConfig.displayName : 'pipette'

  let defaultFlowRate = null
  if (pipetteConfig) {
    if (flowRateType === 'aspirate') {
      defaultFlowRate = pipetteConfig.aspirateFlowRate
    } else if (flowRateType === 'dispense') {
      defaultFlowRate = pipetteConfig.dispenseFlowRate
    }
  } else {
    console.warn('FlowRateField mapStateToProps expected pipetteConfig', ownProps)
  }

  const formFlowRate = formData && formData[name]

  // force each field to have a new instance created when value is changed
  const innerKey = `${name}:${formFlowRate || 0}`

  return {
    innerKey,
    formFlowRate,
    flowRateType,
    defaultFlowRate,
    minFlowRate: 0,
    // NOTE: since we only have rule-of-thumb, max is entire volume in 1 second
    maxFlowRate: pipetteConfig ? pipetteConfig.nominalMaxVolumeUl : Infinity,
    pipetteModelDisplayName
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>, ownProps: OP): DP {
  return {
    updateValue: (flowRate: ?number) => dispatch(
      steplistActions.changeFormInput({
        update: {
          [ownProps.name]: flowRate
        }
      })
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(FlowRateFieldWithKey)
