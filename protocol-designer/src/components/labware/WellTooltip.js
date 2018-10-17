// @flow
import * as React from 'react'

import type {LocationLiquidState} from '../../step-generation'
import {PillTooltipContents} from '../steplist/SubstepRow'
import type {WellIngredientNames} from '../../steplist/types'

import styles from './labware.css'

type Props = {ingredNames: WellIngredientNames, wrapperRef: React.Element<*>}

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

class WellTooltip extends React.Component<Props, State> {
  state: State = initialState

  makeHandleMouseMove = (wellName: string, wellIngreds: LocationLiquidState) => (e) => {
    const {pageX, pageY} = e
    if (Object.keys(wellIngreds).length > 0 && pageX && pageY) {
      const wrapperLeft = 0//this.props.wrapperRef ? this.props.wrapperRef.getBoundingpageRect().left : 0
      const wrapperTop = 0//this.props.wrapperRef ? this.props.wrapperRef.getBoundingpageRect().top : 0
      console.table({e, wellName, wellIngreds, pageX, pageY})
      this.setState({
        tooltipX: pageX - wrapperLeft + MOUSE_TOOLTIP_OFFSET_PIXELS,
        tooltipY: pageY - wrapperTop + MOUSE_TOOLTIP_OFFSET_PIXELS,
        tooltipWellName: wellName,
        tooltipWellIngreds: wellIngreds,
      })
    }
  }

  handleMouseLeaveWell = (e) => {
    this.setState(initialState)
  }

  render () {
    return (
      <React.Fragment>
        {this.props.children({
          makeHandleMouseMove: this.makeHandleMouseMove,
          handleMouseLeaveWell: this.handleMouseLeaveWell,
          tooltipWellName: this.state.tooltipWellName,
        })}
        {this.state.tooltipWellName &&
          <div
            style={{
              left: this.state.tooltipX,
              top: this.state.tooltipY,
              position: 'absolute',
            }}>
            <div className={styles.tooltip_box}>
              <PillTooltipContents
                well={this.state.tooltipWellName}
                ingredNames={this.props.ingredNames}
                ingreds={this.state.tooltipWellIngreds || {}} />
            </div>
          </div>
        }
      </React.Fragment>
    )
  }
}

export default WellTooltip
