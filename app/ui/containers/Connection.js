import {connect} from 'react-redux'

import {
  actions as robotActions,
  selectors as robotSelectors,
  constants as robotConstants
} from '../robot'

import ConnectPanel from '../components/ConnectPanel'

const mapStateToProps = (state) => {
  const connectionStatus = robotSelectors.getConnectionStatus(state)
  const isConnected = connectionStatus === robotConstants.CONNECTED
  return {
    discovered: [
      {hostname: 'bot.local'},
      {hostname: 'other.local'}
    ],
    connectionStatus: robotSelectors.getConnectionStatus(state),
    isConnected
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onConnectClick: () => dispatch(robotActions.connect()),
    onDisconnectClick: () => dispatch(robotActions.disconnect())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectPanel)
