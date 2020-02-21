// @flow
import { connect } from 'react-redux'

import {
  actions as robotActions,
  selectors as robotSelectors,
} from '../../robot'

import { CommandList } from './CommandList'

import type { State, Dispatch } from '../../types'
import type { SessionStatus } from '../../robot'
import type { CommandListProps } from './CommandList'

export { ConfirmCancelModal } from './ConfirmCancelModal'

type SP = {|
  commands: Array<any>,
  sessionStatus: SessionStatus,
  showSpinner: boolean,
|}

type DP = {|
  onResetClick: () => mixed,
|}

export const RunLog = connect<CommandListProps, {||}, _, _, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(CommandList)

function mapStateToProps(state: State): SP {
  return {
    commands: robotSelectors.getCommands(state),
    sessionStatus: robotSelectors.getSessionStatus(state),
    showSpinner:
      robotSelectors.getCancelInProgress(state) ||
      robotSelectors.getSessionLoadInProgress(state),
  }
}

function mapDispatchToProps(dispatch: Dispatch): DP {
  return {
    onResetClick: () => dispatch(robotActions.refreshSession()),
  }
}
