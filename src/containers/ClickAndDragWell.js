import Well from '../components/Well.js'
import { connect } from 'react-redux'

const ClickAndDragWell = connect(
  state => ({}),
  {
    onMouseDown: a => { console.log('down'); return ({type: 'mousedown'}) },
    onMouseUp: a => { console.log('up'); return ({type: 'mouseup'}) }
  }
)(Well)

export default ClickAndDragWell
