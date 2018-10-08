// @flow
import {connect} from 'react-redux'
import type {State} from '../../types'
import {
  actions as robotActions,
  selectors as robotSelectors,
  type SessionStatus,
} from '../../robot'

import CommandList from './CommandList'
import ConfirmCancelModal from './ConfirmCancelModal'

type SP = {
  commands: Array<any>,
  sessionStatus: SessionStatus,
  showSpinner: boolean,
}

function mapStateToProps (state: State): SP {
  return {
    commands: robotSelectors.getCommands(state),
    sessionStatus: robotSelectors.getSessionStatus(state),
    showSpinner: (
      robotSelectors.getCancelInProgress(state) ||
      robotSelectors.getSessionLoadInProgress(state)
    ),
  }
}

const mapDispatchToProps = (dispatch) => ({
  onResetClick: () => dispatch(robotActions.refreshSession()),
})

export default connect(mapStateToProps, mapDispatchToProps)(CommandList)

export {ConfirmCancelModal}
