// @flow
import * as React from 'react'

import {Popper, Reference, Manager} from 'react-popper'
import type {LocationLiquidState} from '../../step-generation'
import {PillTooltipContents} from '../steplist/SubstepRow'
import type {WellIngredientNames} from '../../steplist/types'
import {Portal} from '../portals/TopPortal'

import styles from './labware.css'

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

const MOUSE_TOOLTIP_OFFSET_PIXELS = 14

type MouseTargetProps = {top: number, left: number}
class VirtualMouseTarget extends React.Component<MouseTargetProps> {
  render () {
    return (
      <div style={{
        width: 100,
        height: 100,
        top: this.props.top,
        left: this.props.left,
      }}></div>
    )
  }
}
class WellTooltip extends React.Component<Props, State> {
  state: State = initialState
  mouseRef

  makeHandleMouseMove = (wellName: string, wellIngreds: LocationLiquidState) => (e) => {
    const {pageX, pageY} = e
    if (Object.keys(wellIngreds).length > 0 && pageX && pageY) {
      this.setState({
        tooltipX: pageX + MOUSE_TOOLTIP_OFFSET_PIXELS,
        tooltipY: pageY + MOUSE_TOOLTIP_OFFSET_PIXELS,
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
                  <div ref={ref} style={{position: 'absolute', top: tooltipY, left: tooltipX, height: 1, width: 1}}></div>
                </Portal>
              )
            }
          </Reference>
          {this.props.children({
            makeHandleMouseMove: this.makeHandleMouseMove,
            handleMouseLeaveWell: this.handleMouseLeaveWell,
            tooltipWellName: this.state.tooltipWellName,
          })}
          {this.state.tooltipWellName &&
            <Popper modifiers={{offset: {offset: `0, ${20}`}}} >
              {({ref, style, placement}) => {
                console.log('tried Render', style, placement)
                return (
                  <Portal>
                    <div
                      style={style}
                      ref={ref}
                      data-placement={placement}
                      // style={{left: this.state.tooltipX, top: this.state.tooltipY}}
                      className={styles.tooltip_box}>
                      <PillTooltipContents
                        well={this.state.tooltipWellName}
                        ingredNames={this.props.ingredNames}
                        ingreds={this.state.tooltipWellIngreds || {}} />
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
