// calibration notifications container / component(s)
import {connect} from 'react-redux'

import {
  selectors as robotSelectors
} from '../../robot'

import ConfirmCalibrationPrompt from './ConfirmCalibrationPrompt'

const mapStateToProps = (state, ownProps) => {
  const {slot} = ownProps
  const labware = robotSelectors.getLabware(state)
  const currentLabware = labware.find((lab) => lab.slot === slot)
  return {
    currentLabware
  }
}

export default connect(mapStateToProps)(ConfirmCalibrationPrompt)
