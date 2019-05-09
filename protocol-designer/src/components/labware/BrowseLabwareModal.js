// @flow
import assert from 'assert'
import * as React from 'react'
import cx from 'classnames'
import reduce from 'lodash/reduce'
import { connect } from 'react-redux'

import { Modal, ingredIdsToColor } from '@opentrons/components'
import type { BaseState, ThunkDispatch } from '../../types'
import i18n from '../../localization'

import * as wellContentsSelectors from '../../top-selectors/well-contents'
import { selectors } from '../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
import * as labwareIngredsActions from '../../labware-ingred/actions'
import type { ContentsByWell, WellContents } from '../../labware-ingred/types'
import type { WellIngredientNames } from '../../steplist/types'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

import SingleLabware from '../SingleLabware'

import modalStyles from '../modals/modal.css'
import styles from './labware.css'
import WellTooltip from './WellTooltip'

type SP = {|
  definition: ?LabwareDefinition2,
  wellContents: ContentsByWell,
  ingredNames: WellIngredientNames,
|}

type DP = {|
  drillUp: () => mixed,
|}

type Props = {| ...SP, ...DP |}

class BrowseLabwareModal extends React.Component<Props> {
  handleClose = () => {
    this.props.drillUp()
  }

  render() {
    const { definition } = this.props
    if (!definition) {
      assert(definition, 'BrowseLabwareModal expected definition')
      return null
    }

    const wellFill = reduce(
      // TODO IMMEDIATELY
      this.props.wellContents,
      (acc, wellContents: WellContents, wellName) => ({
        ...acc,
        [wellName]: ingredIdsToColor(wellContents.groupIds),
      }),
      {}
    )

    return (
      <Modal
        className={modalStyles.modal}
        contentsClassName={cx(
          modalStyles.modal_contents,
          modalStyles.transparent_content
        )}
        onCloseClick={this.handleClose}
      >
        <WellTooltip ingredNames={this.props.ingredNames}>
          {({
            makeHandleMouseEnterWell,
            handleMouseLeaveWell,
            tooltipWellName,
          }) => (
            <SingleLabware
              definition={definition}
              showLabels
              wellFill={wellFill}
              highlightedWells={
                new Set(
                  reduce(
                    this.props.wellContents,
                    (acc, wellContents, wellName): Array<string> =>
                      tooltipWellName === wellName ? [...acc, wellName] : acc,
                    []
                  )
                )
              }
              onMouseEnterWell={({ event, wellName }) =>
                makeHandleMouseEnterWell(
                  wellName,
                  this.props.wellContents[wellName].ingreds
                )(event)
              }
              onMouseLeaveWell={handleMouseLeaveWell}
            />
          )}
        </WellTooltip>
        <div className={styles.modal_instructions}>
          {i18n.t('modal.browse_labware.instructions')}
        </div>
      </Modal>
    )
  }
}

function mapStateToProps(state: BaseState): SP {
  const labwareId = selectors.getDrillDownLabwareId(state)
  const definition = labwareId
    ? stepFormSelectors.getLabwareEntities(state)[labwareId]?.def
    : null
  const allWellContents = wellContentsSelectors.getLastValidWellContents(state)
  const wellContents =
    labwareId && allWellContents ? allWellContents[labwareId] : {}
  const ingredNames = selectors.getLiquidNamesById(state)
  return {
    wellContents,
    ingredNames,
    definition,
  }
}

function mapDispatchToProps(dispatch: ThunkDispatch<*>): DP {
  return { drillUp: () => dispatch(labwareIngredsActions.drillUpFromLabware()) }
}

export default connect<Props, {||}, SP, DP, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(BrowseLabwareModal)
