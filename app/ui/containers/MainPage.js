import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Main from '../components/Main';
import * as RobotActions from '../actions/robot';

function mapStateToProps(state) {
  return {
    // User selectors
    robotState: state.robot
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(RobotActions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Main);
