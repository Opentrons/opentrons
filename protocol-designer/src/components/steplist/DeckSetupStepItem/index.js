// @flow
import DeckSetupStepItem from './DeckSetupStepItem'
import * as React from 'react'
import {connect} from 'react-redux'
import type {BaseState, ThunkDispatch} from '../../../types'

import {selectStep, hoverOnStep} from '../../../steplist/actions'
import {selectors as steplistSelectors} from '../../../steplist'

type Props = React.ElementProps<typeof DeckSetupStepItem>

const stepId = 0 // TODO IMMEDIATELY

type SP = {
  hovered: $ElementType<Props, 'hovered'>,
  selected: $ElementType<Props, 'selected'>,
  showDescription: $ElementType<Props, 'showDescription'>
}

type DP = $Diff<Props, SP>

function mapStateToProps (state: BaseState): SP {
  const hovered = steplistSelectors.hoveredStepId(state) === stepId
  const selected = steplistSelectors.selectedStepId(state) === stepId
  return {
    hovered,
    selected,
    showDescription: true // TODO IMMEDIATELY use steplistSelectors??
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>): DP {
  return {
    onStepClick: () => dispatch(selectStep(stepId)),
    onStepHover: () => dispatch(hoverOnStep(stepId)),
    onStepMouseLeave: () => dispatch(hoverOnStep(null))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DeckSetupStepItem)
