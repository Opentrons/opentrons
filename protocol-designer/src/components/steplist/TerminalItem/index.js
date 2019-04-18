// @flow
import { connect } from 'react-redux'
import * as React from 'react'
import type { BaseState, ThunkDispatch } from '../../../types'

import type { TerminalItemId } from '../../../steplist'
import {
  selectors as stepsSelectors,
  actions as stepsActions,
} from '../../../ui/steps'
import { PDTitledList } from '../../lists'
export { default as TerminalItemLink } from './TerminalItemLink'

type Props = React.ElementProps<typeof PDTitledList>

type OP = {|
  id: TerminalItemId,
  title: string,
  children?: React.Node,
|}

type SP = {|
  hovered: $ElementType<Props, 'hovered'>,
  selected: $ElementType<Props, 'selected'>,
|}

function mapStateToProps(state: BaseState, ownProps: OP): SP {
  const { id } = ownProps
  const hovered = stepsSelectors.getHoveredTerminalItemId(state) === id
  const selected = stepsSelectors.getSelectedTerminalItemId(state) === id
  return {
    hovered,
    selected,
  }
}

// TODO Ian: 2018-07-31 annotate type of mergeProps correctly. Related to https://github.com/flow-typed/flow-typed/issues/1269 ?
function mergeProps(
  stateProps: SP,
  dispatchProps: { dispatch: ThunkDispatch<*> },
  ownProps: OP
): * {
  const { id, title, children } = ownProps
  const { dispatch } = dispatchProps
  return {
    ...stateProps,
    title,
    children,
    onClick: () => dispatch(stepsActions.selectTerminalItem(id)),
    onMouseEnter: () => dispatch(stepsActions.hoverOnTerminalItem(id)),
    onMouseLeave: () => dispatch(stepsActions.hoverOnTerminalItem(null)),
  }
}

export default connect<Props, OP, SP, {||}, _, _>(
  mapStateToProps,
  null,
  mergeProps
)(PDTitledList)
