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
  pipetteFieldName: StepFieldName
}

type DP = {
  updateValue: $PropertyType<Props, 'updateValue'>
}

type SP = $Diff<Props, DP>

function mapStateToProps (state: BaseState, ownProps: OP): SP {
  const formData = steplistSelectors.getUnsavedForm(state)

  const pipetteId = formData && formData[ownProps.pipetteFieldName]
  const pipette = pipetteId && pipetteSelectors.pipettesById(state)[pipetteId]
  const pipetteConfig = pipette && getPipette(pipette.model)
  const pipetteModelDisplayName = pipetteConfig ? pipetteConfig.displayName : 'pipette'

  return {
    flowRate: formData && formData[ownProps.name],
    flowRateType: 'aspirate', // TODO IMMEDIATELY
    defaultFlowRate: 222, // TODO IMMEDIATELY
    minFlowRate: 123, // TODO IMMEDIATELY
    maxFlowRate: 1234, // TODO IMMEDIATELY
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
