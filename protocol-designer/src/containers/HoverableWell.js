// This was DEPRECATED with the SVG transition.
// TODO: make component library Plate take event handlers for onMouseEnterWell, onMouseLeaveWell

import { connect } from 'react-redux'

import { hoverWellBegin, hoverWellEnd } from '../labware-ingred/actions'
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
