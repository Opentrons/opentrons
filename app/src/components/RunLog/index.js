// @flow
import { connect } from 'react-redux'
import type { State } from '../../types'
import {
  actions as robotActions,
  selectors as robotSelectors,
} from '../../robot'

import CommandList from './CommandList'
import ConfirmCancelModal from './ConfirmCancelModal'

import type { SessionStatus } from '../../robot'

type SP = {|
  commands: Array<any>,
  sessionStatus: SessionStatus,
  showSpinner: boolean,
|}

type DP = {|
  onResetClick: () => mixed,
|}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CommandList)
export { ConfirmCancelModal }

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
