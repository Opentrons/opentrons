// container wrapping PipetteConfig component
// displays pipettes and tip probe controls during pipette setup

import {connect} from 'react-redux'

import {selectors as robotSelectors} from '../robot'
import PipetteConfig from '../components/PipetteConfig'

export default connect(mapStateToProps)(PipetteConfig)

function mapStateToProps (state) {
  return {
    instruments: robotSelectors.getInstruments(state)
  }
}
