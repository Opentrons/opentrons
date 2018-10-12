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

import * as wellContentsSelectors from '../../top-selectors/well-contents'
import {selectors} from '../../labware-ingred/reducers'
import * as labwareIngredsActions from '../../labware-ingred/actions'
import type {ContentsByWell} from '../../labware-ingred/types'

import SingleLabwareWrapper from '../SingleLabware'

import modalStyles from '../modals/modal.css'
import styles from './labware.css'

type SP = {
  wellContents: ContentsByWell,
  labwareType: string,
}
type DP = {
  drillUp: () => mixed,
}

type Props = SP & DP

class BrowseLabwareModal extends React.Component<Props> {
  handleClose = () => {
    this.props.drillUp()
  }

  render () {
    const allWellDefsByName = getWellDefsForSVG(this.props.labwareType)

    return (
      <Modal
        className={modalStyles.modal}
        contentsClassName={cx(modalStyles.modal_contents, modalStyles.transparent_content)}
        onCloseClick={this.handleClose}>
        <SingleLabwareWrapper showLabels>
          <g>
            <LabwareOutline />
            {map(this.props.wellContents, (well, wellName) => (
              <Well
                selectable
                key={wellName}
                wellName={wellName}
                highlighted={well.highlighted}
                selected={well.selected}
                fillColor={ingredIdsToColor(well.groupIds)}
                svgOffset={{x: 1, y: -3}}
                wellDef={allWellDefsByName[wellName]} />
            ))}
          </g>
          <LabwareLabels labwareType={this.props.labwareType} inner={false} />
        </SingleLabwareWrapper>
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

  return {
    wellContents,
    labwareType: labware ? labware.type : 'missing labware',
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>): DP {
  return {drillUp: () => dispatch(labwareIngredsActions.drillUpFromLabware())}
}

export default connect(mapStateToProps, mapDispatchToProps)(BrowseLabwareModal)
