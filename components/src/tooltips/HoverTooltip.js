// @flow

import * as React from 'react'

import Tooltip from './Tooltip'

import type { TooltipChildProps, TooltipProps } from './Tooltip'

const OPEN_DELAY_MS = 300
const CLOSE_DELAY_MS = 0

export type HoverTooltipHandlers = TooltipChildProps<{
  onMouseEnter: (SyntheticMouseEvent<*>) => void,
  onMouseLeave: (SyntheticMouseEvent<*>) => void,
}>

type Props = TooltipProps<HoverTooltipHandlers>

type State = { isOpen: boolean }

/**
 * Tooltip component that triggers on `MouseEnter` and `MouseLeave`. See
 * `Tooltip` for full props list.
 *
 * `props.children` is a function that receives the following props object:
 * ```js
 * type HoverTooltipHandlers = {|
 *   ref: React.Ref<*>,
 *   onMouseEnter: (SyntheticMouseEvent<*>) => void,
 *   onMouseLeave: (SyntheticMouseEvent<*>) => void,
 * |}
 * ```
 */
class HoverTooltip extends React.Component<Props, State> {
  openTimeout: ?TimeoutID
  closeTimeout: ?TimeoutID

  constructor(props: Props) {
    super(props)
    this.openTimeout = null
    this.closeTimeout = null
    this.state = { isOpen: false }
  }

  componentWillUnmount() {
    if (this.closeTimeout) clearTimeout(this.closeTimeout)
    if (this.openTimeout) clearTimeout(this.openTimeout)
  }

  delayedOpen = () => {
    if (this.closeTimeout) clearTimeout(this.closeTimeout)
    this.openTimeout = setTimeout(
      () => this.setState({ isOpen: true }),
      OPEN_DELAY_MS
    )
  }
  delayedClose = () => {
    if (this.openTimeout) clearTimeout(this.openTimeout)
    this.closeTimeout = setTimeout(
      () => this.setState({ isOpen: false }),
      CLOSE_DELAY_MS
    )
  }

  render() {
    return (
      <Tooltip
        open={this.state.isOpen}
        childProps={{
          onMouseEnter: this.delayedOpen,
          onMouseLeave: this.delayedClose,
        }}
        {...this.props}
      />
    )
  }
}

export default HoverTooltip
