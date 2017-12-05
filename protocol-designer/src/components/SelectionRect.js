import React from 'react'
import PropTypes from 'prop-types'

import style from './SelectionRect.css'

class SelectionRect extends React.Component {
  static propTypes = {
    // callbacks with (event, rect)
    onSelectionMove: PropTypes.func,
    onSelectionDone: PropTypes.func,

    children: PropTypes.element
  }

  constructor (props) {
    super(props)
    this.state = { positions: null }

    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleDrag = this.handleDrag.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
  }

  renderRect ({xStart, yStart, xDynamic, yDynamic}) {
    const left = Math.min(xStart, xDynamic)
    const top = Math.min(yStart, yDynamic)
    const width = Math.abs(xDynamic - xStart)
    const height = Math.abs(yDynamic - yStart)

    if (this.props.svg) {
      // calculate ratio btw clientRect bounding box vs svg parent viewBox
      // WARNING: May not work right if you're nesting SVGs!
      const clientRect = this.refs.parentRect.getBoundingClientRect()
      const viewBox = this.refs.parentRect.closest('svg').viewBox.baseVal // WARNING: elem.closest() is experiemental

      const xScale = viewBox.width / clientRect.width
      const yScale = viewBox.height / clientRect.height

      return <rect
        x={(left - clientRect.left) * xScale}
        y={(top - clientRect.top) * yScale}
        width={width * xScale}
        height={height * yScale}
        className={style.selection_rect}
      />
    }

    return <div
      className={style.selection_rect}
      style={{
        left: left + 'px',
        top: top + 'px',
        width: width + 'px',
        height: height + 'px'
      }}
    />
  }

  getRect ({xStart, yStart, xDynamic, yDynamic}) {
    // convert internal rect position to more generic form
    // TODO should this be used in renderRect?
    return {
      x0: Math.min(xStart, xDynamic),
      x1: Math.max(xStart, xDynamic),
      y0: Math.min(yStart, yDynamic),
      y1: Math.max(yStart, yDynamic)
    }
  }

  handleMouseDown (e) {
    window.addEventListener('mousemove', this.handleDrag)
    window.addEventListener('mouseup', this.handleMouseUp)
    this.setState({ positions: {xStart: e.clientX, xDynamic: e.clientX, yStart: e.clientY, yDynamic: e.clientY} })
  }

  handleDrag (e) {
    this.setState({ positions: {...this.state.positions, xDynamic: e.clientX, yDynamic: e.clientY} })

    this.props.onSelectionMove &&
      this.props.onSelectionMove(e, this.getRect(this.state.positions))
  }

  handleMouseUp (e) {
    window.removeEventListener('mousemove', this.handleDrag)
    window.removeEventListener('mouseup', this.handleMouseUp)

    const finalRect = this.getRect(this.state.positions)

    // clear the rectangle
    this.setState({ positions: null })

    // call onSelectionDone callback with {x0, x1, y0, y1} of final selection rectangle
    this.props.onSelectionDone &&
      this.props.onSelectionDone(e, finalRect)
  }

  render () {
    const { svg, children } = this.props

    return svg
      ? <g onMouseDown={this.handleMouseDown} ref='parentRect'>
        {children}
        {this.state.positions && this.renderRect(this.state.positions)}
      </g>
      : <div onMouseDown={this.handleMouseDown} ref='parentRect'>
        {this.state.positions && this.renderRect(this.state.positions)}
        {children}
      </div>
  }
}

export default SelectionRect
