// @flow
import DeckSetupStepItem from './DeckSetupStepItem'
import * as React from 'react'
import {connect} from 'react-redux'
import type {BaseState, ThunkDispatch} from '../../../types'

import {
  actions as steplistActions,
  selectors as steplistSelectors
} from '../../../steplist'
import {START_TERMINAL_ID} from '../../../steplist/types'

type Props = React.ElementProps<typeof DeckSetupStepItem>

type SP = {
  hovered: $ElementType<Props, 'hovered'>,
  selected: $ElementType<Props, 'selected'>,
  showDescription: $ElementType<Props, 'showDescription'>
}

type DP = $Diff<Props, SP>

const ID = START_TERMINAL_ID

function mapStateToProps (state: BaseState): SP {
  const hovered = steplistSelectors.getHoveredTerminalItemId(state) === ID
  const selected = steplistSelectors.getSelectedTerminalItemId(state) === ID
  return {
    hovered,
    selected,
    showDescription: selected // TODO IMMEDIATELY use steplistSelectors??
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>): DP {
  return {
    onStepClick: () => dispatch(steplistActions.selectTerminalItem(ID)),
    onStepHover: () => dispatch(steplistActions.hoverOnTerminalItem(ID)),
    onStepMouseLeave: () => dispatch(steplistActions.hoverOnTerminalItem(null))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DeckSetupStepItem)
