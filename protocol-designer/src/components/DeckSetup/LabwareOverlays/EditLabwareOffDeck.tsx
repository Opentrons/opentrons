import * as React from 'react'
import { connect } from 'react-redux'
import { css } from 'styled-components'
import {
  ALIGN_FLEX_START,
  COLORS,
  DIRECTION_COLUMN,
  Icon,
  JUSTIFY_SPACE_AROUND,
  POSITION_ABSOLUTE,
  SPACING,
} from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { i18n } from '../../../localization'
import {
  deleteContainer,
  duplicateLabware,
  openIngredientSelector,
} from '../../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'
import { NameThisLabware } from './NameThisLabware'
import styles from './LabwareOverlays.css'

import type { LabwareEntity } from '@opentrons/step-generation'
import type { BaseState, ThunkDispatch } from '../../../types'

interface OP {
  labwareEntity: LabwareEntity
}
interface SP {
  isYetUnnamed: boolean
}
interface DP {
  editLiquids: () => void
  duplicateLabware: () => void
  deleteLabware: () => void
}

type Props = OP & SP & DP

const EditLabwareOffDeckComponent = (props: Props): JSX.Element => {
  const {
    labwareEntity,
    isYetUnnamed,
    editLiquids,
    deleteLabware,
    duplicateLabware,
  } = props

  const { isTiprack } = labwareEntity.def.parameters
  if (isYetUnnamed && !isTiprack) {
    return (
      <div
        css={css`
          z-index: 1;
          bottom: 0;
          position: ${POSITION_ABSOLUTE};
          width: 127.76px;
          height: 85.45px;
          opacity: 0;
          &:hover {
            opacity: 1;
          }
        `}
      >
        <NameThisLabware
          labwareOnDeck={labwareEntity}
          editLiquids={editLiquids}
        />
      </div>
    )
  } else {
    return (
      <div
        css={css`
          z-index: 1;
          padding: ${SPACING.spacing8};
          background-color: ${COLORS.darkBlack90};
          flex-direction: ${DIRECTION_COLUMN};
          color: ${COLORS.white};
          display: flex;
          align-items: ${ALIGN_FLEX_START};
          justify-content: ${JUSTIFY_SPACE_AROUND};
          border-radius: 0.5rem;
          bottom: 0;
          font-size: 0.7rem;
          position: ${POSITION_ABSOLUTE};
          width: 127.76px;
          height: 85.45px;
          opacity: 0;
          &:hover {
            opacity: 1;
          }
        `}
      >
        {!isTiprack ? (
          <a className={styles.overlay_button} onClick={editLiquids}>
            <Icon className={styles.overlay_icon} name="pencil" />
            {i18n.t('deck.overlay.edit.name_and_liquids')}
          </a>
        ) : (
          <div className={styles.button_spacer} />
        )}
        <a className={styles.overlay_button} onClick={duplicateLabware}>
          <Icon className={styles.overlay_icon} name="content-copy" />
          {i18n.t('deck.overlay.edit.duplicate')}
        </a>
        <a className={styles.overlay_button} onClick={deleteLabware}>
          <Icon className={styles.overlay_icon} name="close" />
          {i18n.t('deck.overlay.edit.delete')}
        </a>
      </div>
    )
  }
}

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const { id } = ownProps.labwareEntity
  const hasName = labwareIngredSelectors.getSavedLabware(state)[id]
  return {
    isYetUnnamed: !ownProps.labwareEntity.def.parameters.isTiprack && !hasName,
  }
}

const mapDispatchToProps = (
  dispatch: ThunkDispatch<any>,
  ownProps: OP
): DP => ({
  editLiquids: () =>
    dispatch(openIngredientSelector(ownProps.labwareEntity.id)),
  duplicateLabware: () => dispatch(duplicateLabware(ownProps.labwareEntity.id)),
  deleteLabware: () => {
    window.confirm(
      `Are you sure you want to permanently delete this ${getLabwareDisplayName(
        ownProps.labwareEntity.def
      )}?`
    ) && dispatch(deleteContainer({ labwareId: ownProps.labwareEntity.id }))
  },
})

export const EditLabwareOffDeck = connect(
  mapStateToProps,
  mapDispatchToProps
)(EditLabwareOffDeckComponent)
