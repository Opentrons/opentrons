import * as React from 'react'

import styles from './SelectionRect.module.module.css'
import { DragRect, GenericRect } from '../collision-types'

interface Props {
  onSelectionMove?: (e: MouseEvent, arg: GenericRect) => unknown
  onSelectionDone?: (e: MouseEvent, arg: GenericRect) => unknown
  svg?: boolean // set true if this is an embedded SVG
  children?: React.ReactNode
  originXOffset?: number
  originYOffset?: number
}

interface State {
  positions: DragRect | null
}

export class SelectionRect extends React.Component<Props, State> {
  parentRef?: HTMLElement | SVGElement | null

  constructor(props: Props) {
    super(props)
    this.state = { positions: null }
  }

  renderRect(args: DragRect): React.ReactNode {
    const { xStart, yStart, xDynamic, yDynamic } = args
    const left = Math.min(xStart, xDynamic)
    const top = Math.min(yStart, yDynamic)
    const width = Math.abs(xDynamic - xStart)
    const height = Math.abs(yDynamic - yStart)
    const { originXOffset = 0, originYOffset = 0 } = this.props
    if (this.props.svg) {
      // calculate ratio btw clientRect bounding box vs svg parent viewBox
      // WARNING: May not work right if you're nesting SVGs!
      const parentRef = this.parentRef
      if (!parentRef) {
        return null
      }

      const clientRect: {
        width: number
        height: number
        left: number
        top: number
      } = parentRef.getBoundingClientRect()
      // @ts-expect-error(sa, 2021-7-1): parentRef.closest might return null
      const viewBox: { width: number; height: number } = parentRef.closest(
        'svg'
      ).viewBox.baseVal // WARNING: elem.closest() is experiemental

      const xScale = viewBox.width / clientRect.width
      const yScale = viewBox.height / clientRect.height

      return (
        <rect
          x={(left - clientRect.left) * xScale - originXOffset}
          y={(top - clientRect.top) * yScale - originYOffset}
          width={width * xScale}
          height={height * yScale}
          className={styles.selection_rect}
        />
      )
    }

    return (
      <div
        className={styles.selection_rect}
        style={{
          left: left + 'px',
          top: top + 'px',
          width: width + 'px',
          height: height + 'px',
        }}
      />
    )
  }

  getRect(args: DragRect): GenericRect {
    const { xStart, yStart, xDynamic, yDynamic } = args
    // convert internal rect position to more generic form
    // TODO should this be used in renderRect?
    return {
      x0: Math.min(xStart, xDynamic),
      x1: Math.max(xStart, xDynamic),
      y0: Math.min(yStart, yDynamic),
      y1: Math.max(yStart, yDynamic),
    }
  }

  handleMouseDown: React.MouseEventHandler = e => {
    document.addEventListener('mousemove', this.handleDrag)
    document.addEventListener('mouseup', this.handleMouseUp)
    this.setState({
      positions: {
        xStart: e.clientX,
        xDynamic: e.clientX,
        yStart: e.clientY,
        yDynamic: e.clientY,
      },
    })
  }

  handleDrag: (e: MouseEvent) => void = e => {
    if (this.state.positions) {
      const nextRect = {
        ...this.state.positions,
        xDynamic: e.clientX,
        yDynamic: e.clientY,
      }
      this.setState({ positions: nextRect })

      const rect = this.getRect(nextRect)
      this.props.onSelectionMove && this.props.onSelectionMove(e, rect)
    }
  }

  handleMouseUp: (e: MouseEvent) => void = e => {
    if (!(e instanceof MouseEvent)) {
      return
    }
    document.removeEventListener('mousemove', this.handleDrag)
    document.removeEventListener('mouseup', this.handleMouseUp)

    const finalRect = this.state.positions && this.getRect(this.state.positions)

    // clear the rectangle
    this.setState({ positions: null })

    // call onSelectionDone callback with {x0, x1, y0, y1} of final selection rectangle
    this.props.onSelectionDone &&
      finalRect &&
      this.props.onSelectionDone(e, finalRect)
  }

  render(): React.ReactNode {
    const { svg, children } = this.props

    return svg ? (
      <g
        onMouseDown={this.handleMouseDown}
        ref={ref => {
          this.parentRef = ref
        }}
      >
        {children}
        {this.state.positions && this.renderRect(this.state.positions)}
      </g>
    ) : (
      <div
        onMouseDown={this.handleMouseDown}
        ref={ref => {
          this.parentRef = ref
        }}
      >
        {this.state.positions && this.renderRect(this.state.positions)}
        {children}
      </div>
    )
  }
}
