import { connect } from 'react-redux'

import { hoverWellBegin, hoverWellEnd } from '../actions'
import Well from '../components/Well.js'

export default connect(
  null, // gets props from Plate
  (dispatch, ownProps) => {
    const { x, y } = ownProps
    return {
      onMouseEnter: e => dispatch(hoverWellBegin(x, y)),
      onMouseLeave: e => dispatch(hoverWellEnd(x, y))
    }
  }
)(Well)
