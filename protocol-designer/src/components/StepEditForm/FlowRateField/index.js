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

type Props = React.ElementProps<typeof FlowRateField>

type OP = {
  name: StepFieldName,
  pipetteFieldName: StepFieldName,
  flowRateType: $PropertyType<Props, 'flowRateType'>
}

type DP = {
  updateValue: $PropertyType<Props, 'updateValue'>
}

type SP = $Diff<Props, DP>

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

  return {
    flowRate: formData && formData[name],
    flowRateType,
    defaultFlowRate,
    // HACK since we only have rule-of-thumb
    minFlowRate: (defaultFlowRate != null) ? defaultFlowRate / 10 : null,
    // HACK since we only have rule-of-thumb
    maxFlowRate: (defaultFlowRate != null) ? defaultFlowRate * 10 : null,
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

export default connect(mapStateToProps, mapDispatchToProps)(FlowRateField)
