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
  HoverTooltip,
} from '@opentrons/components'
import type {BaseState, ThunkDispatch} from '../../types'
import i18n from '../../localization'

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

const initialState = {
  tooltipX: null,
  tooltipY: null,
  tooltipWellName: null,
  tooltipwellIngreds: null,
  tooltipHeight: null,
  tooltipWidth: null,
}

const MOUSE_TOOLTIP_OFFSET_PIXELS = 14

class BrowseLabwareModal extends React.Component<Props> {
  state = initialState
  wrapperRef

  makeHandleWellMouseOver = (wellName, wellIngreds) => (e) => {
    const {clientX, clientY} = e
    if (Object.keys(wellIngreds).length > 0 && clientX && clientY && this.wrapperRef) {
      this.setState({
        tooltipX: clientX - this.wrapperRef.getBoundingClientRect().left + MOUSE_TOOLTIP_OFFSET_PIXELS,
        tooltipY: clientY - this.wrapperRef.getBoundingClientRect().top + MOUSE_TOOLTIP_OFFSET_PIXELS,
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
      <Modal
        innerRef={ref => { this.wrapperRef = ref }}
        className={modalStyles.modal}
        contentsClassName={cx(modalStyles.modal_contents, modalStyles.transparent_content)}
        onCloseClick={this.handleClose}>
        <SingleLabwareWrapper showLabels>
          <g>
            <LabwareOutline />
            {map(this.props.wellContents, (well, wellName) => {
              const color = ingredIdsToColor(well.groupIds)
              const mouseHandlers = color
                ? {
                  onMouseMove: this.makeHandleWellMouseOver(wellName, well.ingreds),
                  onMouseLeave: this.handleWellMouseLeave,
                }
                : {}
              return (
                <Well
                  {...mouseHandlers}
                  key={wellName}
                  wellName={wellName}
                  fillColor={color}
                  svgOffset={{x: 1, y: -3}}
                  wellDef={allWellDefsByName[wellName]} />
              )
            })}

          </g>
          <LabwareLabels labwareType={this.props.labwareType} inner={false} />
        </SingleLabwareWrapper>
        {this.state.tooltipWellName &&
          <div
            style={{
              left: this.state.tooltipX,
              top: this.state.tooltipY,
              position: 'absolute',
            }}>
            <div
              className={styles.tooltip_box}
              xmlns="http://www.w3.org/1999/xhtml">
              <PillTooltipContents
                well={this.state.tooltipWellName}
                ingredNames={this.props.ingredNames}
                ingreds={this.state.tooltipWellIngreds} />
            </div>
          </div>
        }
        <div className={styles.modal_instructions}>{i18n.t('modal.browse_labware.instructions')}</div>
      </Modal>
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
