import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  constants as robotConstants
} from '../robot'

import ConnectPanel from '../components/ConnectPanel'

const mapStateToProps = (state) => {
  const connectionStatus = robotSelectors.getConnectionStatus(state)
  const isConnected = connectionStatus === robotConstants.CONNECTED
  return {
    scanning: false,
    discovered: [
      {hostname: 'bot.local', isCurrent: false},
      {hostname: 'other.local', isCurrent: true}
    ],
    connectionStatus: robotSelectors.getConnectionStatus(state),
    isConnected
  }
}

export default connect(mapStateToProps)(ConnectPanel)
