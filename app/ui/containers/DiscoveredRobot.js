import {connect} from 'react-redux'

import RobotItem from '../components/RobotItem'

import {
  actions as robotActions
} from '../robot'

const mapStateToProps = (state, ownProps) => ownProps

const mapDispatchToProps = (dispatch, ownProps) => {
  // only allow disconnect if connected and vice versa
  if (ownProps.isConnected) {
    return {onDisconnectClick: () => dispatch(robotActions.disconnect())}
  }

  return {
    onConnectClick: () => dispatch(robotActions.connect(ownProps.host))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(RobotItem)
