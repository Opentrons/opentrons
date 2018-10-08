// @flow
import * as React from 'react'
import cx from 'classnames'
import reduce from 'lodash/reduce'
import map from 'lodash/map'
import {connect} from 'react-redux'

import {
  getWellDefsForSVG,
  getLabware,
  getIsTiprack,
} from '@opentrons/shared-data'

import {
  Modal,
  OutlineButton,
  Tip,
  Well,
  LabwareOutline,
  ingredIdsToColor,
} from '@opentrons/components'
import type {BaseState, ThunkDispatch} from '../../types'

import * as wellContentsSelectors from '../../top-selectors/well-contents'
import {selectors} from '../../labware-ingred/reducers'
import * as labwareIngredsActions from '../../labware-ingred/actions'
import {selectors as steplistSelectors} from '../../steplist'
import type {ContentsByWell} from '../../labware-ingred/types'

import SingleLabwareWrapper from '../SingleLabware'
import WellSelectionInstructions from '../WellSelectionInstructions'

import styles from '../StepEditForm/WellSelectionInput/WellSelectionModal.css'
import modalStyles from '../modals/modal.css'

type OP = {
  labwareId: ?string,
  drillUp: () => mixed,
}
type SP = {
  wellContents: ContentsByWell,
  labwareType: string,
}

type Props = OP & SP

class BrowseLabwareModal extends React.Component<Props, State> {
  constructor (props) {
    super(props)
    const initialSelectedWells = reduce(this.props.initialSelectedWells, (acc, well) => (
      {...acc, [well]: well}
    ), {})
    this.state = {selectedWells: initialSelectedWells, highlightedWells: {}}
  }

  handleClose = () => {
    this.props.drillUp()
  }

  render () {
    const allWellDefsByName = getWellDefsForSVG(this.props.labwareType)
    const isTiprack = getIsTiprack(this.props.labwareType)
    const labwareDefinition = getLabware(this.props.labwareType)

    const tipVolume = labwareDefinition && labwareDefinition.metadata && labwareDefinition.metadata.tipVolume

    return (
      <Modal
        className={modalStyles.modal}
        contentsClassName={cx(modalStyles.modal_contents, modalStyles.transparent_content)}
        onCloseClick={this.handleClose}>
        <SingleLabwareWrapper>
          <g>
            <LabwareOutline className={isTiprack ? styles.tiprack_plate_outline : null}/>
            {map(this.props.wellContents, (well, wellName) => {
              if (isTiprack) {
                const tipProps = (this.props.getTipProps && this.props.getTipProps(wellName)) || {}
                return (
                  <Tip
                    key={wellName}
                    wellDef={allWellDefsByName[wellName]}
                    tipVolume={tipVolume}
                    {...tipProps}
                  />
                )
              } else {
                return (
                  <Well
                    selectable
                    key={wellName}
                    wellName={wellName}
                    highlighted={well.highlighted}
                    selected={well.selected}
                    fillColor={ingredIdsToColor(well.groupIds)}
                    svgOffset={{x: 1, y: -3}}
                    wellDef={allWellDefsByName[wellName]} />
                )
              }
            })}
          </g>
        </SingleLabwareWrapper>
        <WellSelectionInstructions />
      </Modal>
    )
  }
}

function mapStateToProps (state: BaseState, ownProps: OP): SP {
  const labwareId = selectors.getDrillDownLabwareId(state)

  const labware = labwareId && selectors.getLabware(state)[labwareId]
  const allWellContentsForSteps = wellContentsSelectors.allWellContentsForSteps(state)

  const stepId = steplistSelectors.getActiveItem(state).id
  // TODO: Ian 2018-07-31 replace with util function, "findIndexOrNull"?
  const orderedSteps = steplistSelectors.orderedSteps(state)
  const timelineIdx = orderedSteps.findIndex(id => id === stepId)

  return {
    wellContents: labware ? allWellContentsForSteps[timelineIdx][labware.id] : {},
    labwareType: labware ? labware.type : 'missing labware',
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>, ownProps: OP): DP {
  return {
    drillUp: () => dispatch(labwareIngredsActions.drillUpFromLabware()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(BrowseLabwareModal)
