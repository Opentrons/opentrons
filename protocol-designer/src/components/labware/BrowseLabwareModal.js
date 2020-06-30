// @flow
import assert from 'assert'
import * as React from 'react'
import cx from 'classnames'
import { connect } from 'react-redux'

import { Modal } from '@opentrons/components'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import * as wellContentsSelectors from '../../top-selectors/well-contents'
import { selectors } from '../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
import * as labwareIngredsActions from '../../labware-ingred/actions'

import type { BaseState, ThunkDispatch } from '../../types'
import type { ContentsByWell } from '../../labware-ingred/types'
import type { WellIngredientNames } from '../../steplist/types'
import { i18n } from '../../localization'

import modalStyles from '../modals/modal.css'
import { BrowsableLabware } from './BrowsableLabware'
import styles from './labware.css'

type SP = {|
  definition: ?LabwareDefinition2,
  wellContents: ContentsByWell,
  ingredNames: WellIngredientNames,
|}

type DP = {|
  drillUp: () => mixed,
|}

type Props = {| ...SP, ...DP |}

const BrowseLabwareModalComponent = (props: Props) => {
  const { drillUp, definition, ingredNames, wellContents } = props
  if (!definition) {
    assert(definition, 'BrowseLabwareModal expected definition')
    return null
  }

  return (
    <Modal
      className={modalStyles.modal}
      contentsClassName={cx(
        modalStyles.modal_contents,
        modalStyles.transparent_content
      )}
      onCloseClick={drillUp}
    >
      <BrowsableLabware
        definition={definition}
        ingredNames={ingredNames}
        wellContents={wellContents}
      />
      <div className={styles.modal_instructions}>
        {i18n.t('modal.browse_labware.instructions')}
      </div>
    </Modal>
  )
}

function mapStateToProps(state: BaseState): SP {
  const labwareId = selectors.getDrillDownLabwareId(state)
  const definition = labwareId
    ? stepFormSelectors.getLabwareEntities(state)[labwareId]?.def
    : null
  const wellContents = labwareId
    ? wellContentsSelectors.getAllWellContentsForActiveItem(state)[labwareId]
    : {}
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

export const BrowseLabwareModal: React.AbstractComponent<{||}> = connect<
  Props,
  {||},
  SP,
  DP,
  _,
  _
>(
  mapStateToProps,
  mapDispatchToProps
)(BrowseLabwareModalComponent)
