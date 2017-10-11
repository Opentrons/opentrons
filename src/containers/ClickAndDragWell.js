import Well from '../components/Well.js'
import { connect } from 'react-redux'

import {
  mouseDownOnWell,
  mouseUpOnWell
} from '../actions'

const ClickAndDragWell = connect(
  undefined,
  {
    onMouseDown: mouseDownOnWell,
    onMouseUp: mouseUpOnWell
  }
)(Well)

export default ClickAndDragWell
