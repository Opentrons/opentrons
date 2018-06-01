// @flow
import {connect} from 'react-redux'
import type {State} from '../../types'
import {
  selectors as robotSelectors,
  type SessionStatus
} from '../../robot'

import CommandList from './CommandList'
import ConfirmCancelModal from './ConfirmCancelModal'

type SP = {
  commands: Array<any>,
  sessionStatus: SessionStatus,
  showSpinner: boolean,
}

export default connect(mapStateToProps)(CommandList)

export {ConfirmCancelModal}

function mapStateToProps (state: State): SP {
  return {
    commands: robotSelectors.getCommands(state),
    sessionStatus: robotSelectors.getSessionStatus(state),
    showSpinner: (
      robotSelectors.getCancelInProgress(state) ||
      robotSelectors.getSessionLoadInProgress(state)
    )
  }
}
