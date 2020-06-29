// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import type { SessionStatus, SessionStatusInfo } from '../../robot'
import {
  actions as robotActions,
  selectors as robotSelectors,
} from '../../robot'
import type { Dispatch, State } from '../../types'
import type { CommandListProps } from './CommandList'
import { CommandList } from './CommandList'

export { ConfirmCancelModal } from './ConfirmCancelModal'

type SP = {|
  commands: Array<any>,
  sessionStatus: SessionStatus,
  sessionStatusInfo: SessionStatusInfo,
  showSpinner: boolean,
|}

type DP = {|
  onResetClick: () => mixed,
|}

export const RunLog: React.AbstractComponent<{||}> = connect<
  CommandListProps,
  {||},
  _,
  _,
  _,
  _
>(
  mapStateToProps,
  mapDispatchToProps
)(CommandList)

function mapStateToProps(state: State): SP {
  return {
    commands: robotSelectors.getCommands(state),
    sessionStatus: robotSelectors.getSessionStatus(state),
    sessionStatusInfo: robotSelectors.getSessionStatusInfo(state),
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
