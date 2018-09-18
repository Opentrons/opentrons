// @flow

import * as React from 'react'
import { Manager, Reference, Popper } from 'react-popper'
import cx from 'classnames'
import styles from './tooltips.css'

const OPEN_DELAY_MS = 300
const CLOSE_DELAY_MS = 150
const DISTANCE_FROM_REFERENCE = 4

export type HoverTooltipHandlers = {
  ref: React.Ref<*>,
  onMouseEnter: (SyntheticMouseEvent<*>) => void,
  onMouseLeave: (SyntheticMouseEvent<*>) => void,
}
type PopperProps = React.ElementProps<typeof Popper>
type Props = {
  tooltipComponent?: React.Node,
  placement?: $PropertyType<PopperProps, 'placement'>,
  positionFixed?: $PropertyType<PopperProps, 'positionFixed'>,
  modifiers?: $PropertyType<PopperProps, 'modifiers'>,
  children: (?HoverTooltipHandlers) => React.Node,
}
type State = {isOpen: boolean}
class HoverTooltip extends React.Component<Props, State> {
  openTimeout: ?TimeoutID
  closeTimeout: ?TimeoutID

  constructor (props: Props) {
    super(props)
    this.openTimeout = null
    this.closeTimeout = null
    this.state = {isOpen: false}
  }

  delayedOpen = () => {
    if (this.closeTimeout) clearTimeout(this.closeTimeout)
    this.openTimeout = setTimeout(() => this.setState({isOpen: true}), OPEN_DELAY_MS)
  }
  delayedClose = () => {
    if (this.openTimeout) clearTimeout(this.openTimeout)
    this.closeTimeout = setTimeout(() => this.setState({isOpen: false}), CLOSE_DELAY_MS)
  }

  render () {
    if (!this.props.tooltipComponent) return this.props.children()

    return (
      <Manager>
        <Reference>
          {({ref}) => this.props.children({ref, onMouseEnter: this.delayedOpen, onMouseLeave: this.delayedClose})}
        </Reference>
        {
          true &&
          <Popper
            placement={this.props.placement}
            modifiers={{
              offset: {offset: `0, ${DISTANCE_FROM_REFERENCE}`},
              ...this.props.modifiers,
            }}
            positionFixed={this.props.positionFixed}
          >
            {({ref, style, placement, arrowProps}) => {
              let {style: arrowStyle} = arrowProps
              if (placement === 'left' || placement === 'right') {
                arrowStyle = {top: '2px'}
              }
              return (
                <div ref={ref} className={styles.tooltip_box} style={style} data-placement={placement}>
                  {this.props.tooltipComponent}
                  <div className={cx(styles.arrow, styles[placement])} ref={arrowProps.ref} style={arrowStyle} />
                </div>
              )
            }}
          </Popper>
        }
      </Manager>
    )
  }
}

export default HoverTooltip
