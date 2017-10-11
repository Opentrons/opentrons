import React from 'react'
import { connect } from 'react-redux'

const SelectionRect = ({x0, y0, x1, y1}) =>
  <div style={{
    position: 'fixed',
    left: Math.min(x0, x1) + 'px',
    top: Math.min(y0, y1) + 'px',
    width: Math.abs(x1 - x0) + 'px',
    height: Math.abs(y1 - y0) + 'px',
    backgroundColor: 'rgba(0, 0, 255, 0.5)' // <- TODO: use css for colors
  }} />

export default connect(state => ({
  x0: 250,
  y0: 120,
  x1: 450,
  y1: 550
}))(SelectionRect)
