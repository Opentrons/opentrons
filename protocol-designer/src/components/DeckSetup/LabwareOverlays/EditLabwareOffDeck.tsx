import * as React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import { Icon } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { i18n } from '../../../localization'
import {
  deleteContainer,
  openIngredientSelector,
} from '../../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'
import { NameThisLabware } from './NameThisLabware'
import styles from './LabwareOverlays.css'

import type { BaseState, ThunkDispatch } from '../../../types'
import type { LabwareEntity } from '@opentrons/step-generation'

interface OP {
  labwareOnDeck: LabwareEntity
  handleDragHover?: () => void
}
interface SP {
  isYetUnnamed: boolean
}
interface DP {
  editLiquids: () => void
  deleteLabware: () => void
}

type Props = OP & SP & DP

const EditLabwareOffDeckComponent = (props: Props): JSX.Element => {
  const { labwareOnDeck, isYetUnnamed, editLiquids, deleteLabware } = props

  const { isTiprack } = labwareOnDeck.def.parameters
  if (isYetUnnamed && !isTiprack) {
    return (
      <div>wire this up</div>
      //   <NameThisLabware
      //     labwareOnDeck={labwareOnDeck}
      //     editLiquids={editLiquids}
      //   />
    )
  } else {
    return (
      <div className={cx(styles.slot_overlay)}>
        (
        <>
          {!isTiprack ? (
            <a className={styles.overlay_button} onClick={editLiquids}>
              <Icon className={styles.overlay_icon} name="pencil" />
              {i18n.t('deck.overlay.edit.name_and_liquids')}
            </a>
          ) : (
            <div className={styles.button_spacer} />
          )}
          <a className={styles.overlay_button} onClick={deleteLabware}>
            <Icon className={styles.overlay_icon} name="close" />
            {i18n.t('deck.overlay.edit.delete')}
          </a>
        </>
        )
      </div>
    )
  }
}

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const { id } = ownProps.labwareOnDeck
  const hasName = labwareIngredSelectors.getSavedLabware(state)[id]
  return {
    isYetUnnamed: !ownProps.labwareOnDeck.def.parameters.isTiprack && !hasName,
  }
}

const mapDispatchToProps = (
  dispatch: ThunkDispatch<any>,
  ownProps: OP
): DP => ({
  editLiquids: () =>
    dispatch(openIngredientSelector(ownProps.labwareOnDeck.id)),
  deleteLabware: () => {
    window.confirm(
      `Are you sure you want to permanently delete this ${getLabwareDisplayName(
        ownProps.labwareOnDeck.def
      )}?`
    ) && dispatch(deleteContainer({ labwareId: ownProps.labwareOnDeck.id }))
  },
})

export const EditLabwareOffDeck = connect(
  mapStateToProps,
  mapDispatchToProps
)(EditLabwareOffDeckComponent)
