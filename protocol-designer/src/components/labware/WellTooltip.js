// @flow
import * as React from 'react'

import {Popper, Reference, Manager} from 'react-popper'
import cx from 'classnames'
import type {LocationLiquidState} from '../../step-generation'
import {PillTooltipContents} from '../steplist/SubstepRow'
import type {WellIngredientNames} from '../../steplist/types'
import {Portal} from '../portals/TopPortal'

import styles from './labware.css'

const TOOLTIP_OFFSET = 22

type Props = {ingredNames: WellIngredientNames}

type State = {
  tooltipX: ?number,
  tooltipY: ?number,
  tooltipWellName: ?string,
  tooltipWellIngreds: ?LocationLiquidState,
}
const initialState: State = {
  tooltipX: null,
  tooltipY: null,
  tooltipWellName: null,
  tooltipWellIngreds: null,
}

class WellTooltip extends React.Component<Props, State> {
  state: State = initialState
  mouseRef

  makeHandleMouseOverWell = (wellName: string, wellIngreds: LocationLiquidState) => (e) => {
    const wellBoundingRect = e.target.getBoundingClientRect()
    const {x, y, height, width} = wellBoundingRect
    if (Object.keys(wellIngreds).length > 0 && x && y) {
      this.setState({
        tooltipX: x + (width / 2),
        tooltipY: y + (height / 2),
        tooltipWellName: wellName,
        tooltipWellIngreds: wellIngreds,
      })
    }
  }

  handleMouseLeaveWell = (e) => {
    this.setState(initialState)
  }

  render () {
    const {tooltipX, tooltipY} = this.state

    return (
      <React.Fragment>
        <Manager>
          <Reference>
            {({ref}) => (
              <Portal>
                <div
                  ref={ref}
                  className={styles.virtual_reference}
                  style={{top: tooltipY, left: tooltipX}}></div>
              </Portal>
            )}
          </Reference>
          {this.props.children({
            makeHandleMouseOverWell: this.makeHandleMouseOverWell,
            handleMouseLeaveWell: this.handleMouseLeaveWell,
            tooltipWellName: this.state.tooltipWellName,
          })}
          {this.state.tooltipWellName &&
            <Popper modifiers={{offset: {offset: `0, ${TOOLTIP_OFFSET}`}}} >
              {({ref, style, placement, arrowProps}) => {
                return (
                  <Portal>
                    <div
                      style={style}
                      ref={ref}
                      data-placement={placement}
                      className={styles.tooltip_box}>
                      <PillTooltipContents
                        well={this.state.tooltipWellName}
                        ingredNames={this.props.ingredNames}
                        ingreds={this.state.tooltipWellIngreds || {}} />
                      <div className={cx(styles.arrow, styles[placement])} ref={arrowProps.ref} style={arrowProps.style} />
                    </div>
                  </Portal>
                )
              }}
            </Popper>
          }
        </Manager>
      </React.Fragment>
    )
  }
}

export default WellTooltip
