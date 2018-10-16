// @flow
import * as React from 'react'
import cx from 'classnames'
import map from 'lodash/map'
import {connect} from 'react-redux'

import {getWellDefsForSVG} from '@opentrons/shared-data'

import {
  Modal,
  Well,
  LabwareOutline,
  LabwareLabels,
  ingredIdsToColor,
} from '@opentrons/components'
import type {BaseState, ThunkDispatch} from '../../types'
import i18n from '../../localization'

import type {LocationLiquidState} from '../../step-generation'
import {PillTooltipContents} from '../steplist/SubstepRow'
import * as wellContentsSelectors from '../../top-selectors/well-contents'
import {selectors} from '../../labware-ingred/reducers'
import * as labwareIngredsActions from '../../labware-ingred/actions'
import type {ContentsByWell} from '../../labware-ingred/types'
import type {WellIngredientNames} from '../../steplist/types'

import SingleLabwareWrapper from '../SingleLabware'

import modalStyles from '../modals/modal.css'
import styles from './labware.css'

type SP = {
  wellContents: ContentsByWell,
  labwareType: string,
  ingredNames: WellIngredientNames,
}
type DP = {
  drillUp: () => mixed,
}

type Props = SP & DP

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

class BrowseLabwareModal extends React.Component<Props, State> {
  state: State = initialState
  wrapperRef: ?any

  makeHandleWellMouseOver = (wellName: string, wellIngreds: LocationLiquidState) =>
    (e) => {
      const {clientX, clientY} = e
      if (Object.keys(wellIngreds).length > 0 && clientX && clientY && this.wrapperRef) {
        const wrapperLeft = this.wrapperRef ? this.wrapperRef.getBoundingClientRect().left : 0
        const wrapperTop = this.wrapperRef ? this.wrapperRef.getBoundingClientRect().top : 0
        this.setState({
          tooltipX: clientX - wrapperLeft + MOUSE_TOOLTIP_OFFSET_PIXELS,
          tooltipY: clientY - wrapperTop + MOUSE_TOOLTIP_OFFSET_PIXELS,
          tooltipWellName: wellName,
          tooltipWellIngreds: wellIngreds,
        })
      }
    }

  handleWellMouseLeave = (e) => {
    this.setState(initialState)
  }

  handleClose = () => {
    this.props.drillUp()
  }

  render () {
    const allWellDefsByName = getWellDefsForSVG(this.props.labwareType)

    return (
      <React.Fragment>
        {()this.props.children}
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

function mapStateToProps (state: BaseState): SP {
  const labwareId = selectors.getDrillDownLabwareId(state)
  const allLabware = selectors.getLabware(state)
  const labware = labwareId && allLabware ? allLabware[labwareId] : null
  const allWellContents = wellContentsSelectors.lastValidWellContents(state)
  const wellContents = labwareId && allWellContents ? allWellContents[labwareId] : {}
  const ingredNames = selectors.getIngredientNames(state)
  return {
    wellContents,
    ingredNames,
    labwareType: labware ? labware.type : 'missing labware',
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>): DP {
  return {drillUp: () => dispatch(labwareIngredsActions.drillUpFromLabware())}
}

export default connect(mapStateToProps, mapDispatchToProps)(BrowseLabwareModal)
