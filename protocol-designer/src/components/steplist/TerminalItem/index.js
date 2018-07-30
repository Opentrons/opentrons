// @flow
import {connect} from 'react-redux'
import * as React from 'react'
import type {BaseState, ThunkDispatch} from '../../../types'

import {
  actions as steplistActions,
  selectors as steplistSelectors,
  type TerminalItemId
} from '../../../steplist'

import TerminalItem from './TerminalItem'

type Props = React.ElementProps<typeof TerminalItem>

type OP = {
  id: TerminalItemId,
  title: string,
  children?: React.Node
}

type SP = {
  hovered: $ElementType<Props, 'hovered'>,
  selected: $ElementType<Props, 'selected'>
}

function mapStateToProps (state: BaseState, ownProps: OP): SP {
  const {id} = ownProps
  const hovered = steplistSelectors.getHoveredTerminalItemId(state) === id
  const selected = steplistSelectors.getSelectedTerminalItemId(state) === id
  return {
    hovered,
    selected
  }
}

function mergeProps (stateProps: SP, dispatchProps: {dispatch: ThunkDispatch<*>}, ownProps: OP): Props {
  const {id, title, children} = ownProps
  const {dispatch} = dispatchProps
  return {
    ...stateProps,
    title,
    children,
    onStepClick: () => dispatch(steplistActions.selectTerminalItem(id)),
    onStepHover: () => dispatch(steplistActions.hoverOnTerminalItem(id)),
    onStepMouseLeave: () => dispatch(steplistActions.hoverOnTerminalItem(null))
  }
}

export default connect(mapStateToProps, null, mergeProps)(TerminalItem)
