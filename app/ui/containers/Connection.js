import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  constants as robotConstants,
  actions as robotActions
} from '../robot'

import ConnectPanel from '../components/ConnectPanel'

const mapStateToProps = (state) => {
  const connectionStatus = robotSelectors.getConnectionStatus(state)
  const isConnected = connectionStatus === robotConstants.CONNECTED

  return {
    isScanning: robotSelectors.getIsScanning(state),
    discovered: robotSelectors.getDiscovered(state),
    connectionStatus: connectionStatus,
    isConnected
  }
}

const mapDispatchToProps = (dispatch) => ({
  onScanClick: () => dispatch(robotActions.discover())
})

export default connect(mapStateToProps, mapDispatchToProps)(ConnectPanel)
