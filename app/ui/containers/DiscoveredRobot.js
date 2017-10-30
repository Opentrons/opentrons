import {connect} from 'react-redux'

import RobotItem from '../components/RobotItem'

import {
  actions as robotActions,
  selectors as robotSelectors,
  constants as robotConstants
} from '../robot'

const mapStateToProps = (state, ownProps) => {
  const connectionStatus = robotSelectors.getConnectionStatus(state)
  const isConnected = connectionStatus === robotConstants.CONNECTED
  return {
    robot: ownProps.robot,
    isConnected
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  onConnectClick: () => {
    dispatch(robotActions.connect(ownProps.robot.hostname))
  },
  onDisconnectClick: () => {
    dispatch(robotActions.disconnect(ownProps.robot.hostname))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(RobotItem)
