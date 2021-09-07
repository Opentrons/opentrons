import { connect, MapDispatchToProps } from 'react-redux'

import {
  actions as robotActions,
  selectors as robotSelectors,
} from '../../../redux/robot'

import { CommandList } from './CommandList'

import type { State } from '../../../redux/types'
import type { SessionStatus, SessionStatusInfo } from '../../../redux/robot'

export { ConfirmCancelModal } from './ConfirmCancelModal'

interface SP {
  commands: any[]
  sessionStatus: SessionStatus
  sessionStatusInfo: SessionStatusInfo
  showSpinner: boolean
}

interface DP {
  onResetClick: () => unknown
}

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

const mapDispatchToProps: MapDispatchToProps<DP, {}> = dispatch => {
  return {
    onResetClick: () => dispatch(robotActions.refreshSession()),
  }
}

export const RunLog = connect(mapStateToProps, mapDispatchToProps)(CommandList)
