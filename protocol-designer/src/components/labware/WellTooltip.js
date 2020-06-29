// @flow
import cx from 'classnames'
import * as React from 'react'
import { Manager, Popper, Reference } from 'react-popper'

import type { LocationLiquidState } from '../../step-generation'
import type { WellIngredientNames } from '../../steplist/types'
import { Portal } from '../portals/TopPortal'
import { PillTooltipContents } from '../steplist/SubstepRow'
import styles from './labware.css'

const DEFAULT_TOOLTIP_OFFSET = 22
const WELL_BORDER_WIDTH = 4

type WellTooltipParams = {
  makeHandleMouseEnterWell: (
    wellName: string,
    wellIngreds: LocationLiquidState
  ) => (e: SyntheticMouseEvent<*>) => void,
  handleMouseLeaveWell: mixed => void,
  tooltipWellName: ?string,
}

type Props = {
  children: WellTooltipParams => React.Node,
  ingredNames: WellIngredientNames,
}

type State = {
  tooltipX: ?number,
  tooltipY: ?number,
  tooltipWellName: ?string,
  tooltipWellIngreds: ?LocationLiquidState,
  tooltipOffset: ?number,
}
const initialState: State = {
  tooltipX: null,
  tooltipY: null,
  tooltipWellName: null,
  tooltipWellIngreds: null,
  tooltipOffset: DEFAULT_TOOLTIP_OFFSET,
}

export class WellTooltip extends React.Component<Props, State> {
  state: State = initialState

  makeHandleMouseEnterWell: (
    wellName: string,
    wellIngreds: LocationLiquidState
  ) => (e: SyntheticMouseEvent<>) => void = (wellName, wellIngreds) => e => {
    const { target } = e
    if (target instanceof Element) {
      const wellBoundingRect = target.getBoundingClientRect()
      const { left, top, height, width } = wellBoundingRect
      if (Object.keys(wellIngreds).length > 0 && left && top) {
        this.setState({
          tooltipX: left + width / 2,
          tooltipY: top + height / 2,
          tooltipWellName: wellName,
          tooltipWellIngreds: wellIngreds,
          tooltipOffset: height / 2,
        })
      }
    }
  }

  handleMouseLeaveWell: () => void = () => {
    this.setState(initialState)
  }

  render(): React.Node {
    const { tooltipX, tooltipY, tooltipOffset } = this.state

    return (
      <React.Fragment>
        <Manager>
          <Reference>
            {({ ref }) => (
              <Portal>
                <div
                  ref={ref}
                  className={styles.virtual_reference}
                  style={{ top: tooltipY, left: tooltipX }}
                />
              </Portal>
            )}
          </Reference>
          {this.props.children({
            makeHandleMouseEnterWell: this.makeHandleMouseEnterWell,
            handleMouseLeaveWell: this.handleMouseLeaveWell,
            tooltipWellName: this.state.tooltipWellName,
          })}
          {this.state.tooltipWellName && (
            <Popper
              modifiers={{
                offset: {
                  offset: `0, ${tooltipOffset + WELL_BORDER_WIDTH * 2}`,
                },
              }}
            >
              {({ ref, style, placement, arrowProps }) => {
                return (
                  <Portal>
                    <div
                      style={style}
                      ref={ref}
                      data-placement={placement}
                      className={styles.tooltip_box}
                    >
                      <PillTooltipContents
                        well={this.state.tooltipWellName || ''}
                        ingredNames={this.props.ingredNames}
                        ingreds={this.state.tooltipWellIngreds || {}}
                      />
                      <div
                        className={cx(styles.arrow, styles[placement])}
                        ref={arrowProps.ref}
                        style={arrowProps.style}
                      />
                    </div>
                  </Portal>
                )
              }}
            </Popper>
          )}
        </Manager>
      </React.Fragment>
    )
  }
}
