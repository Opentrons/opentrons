import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Icon,
  JUSTIFY_SPACE_AROUND,
  POSITION_ABSOLUTE,
  SPACING,
} from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import {
  deleteContainer,
  duplicateLabware,
  openIngredientSelector,
} from '../../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'
import { NameThisLabware } from './NameThisLabware'
import styles from './LabwareOverlays.css'

import type { LabwareEntity } from '@opentrons/step-generation'
import type { ThunkDispatch } from '../../../types'

const NAME_LABWARE_OVERLAY_STYLE = css`
  z-index: 1;
  bottom: 0;
  position: ${POSITION_ABSOLUTE};
  width: 127.76px;
  height: 85.45px;
  opacity: 0;
  &:hover {
    opacity: 1;
  }
`

const REGULAR_OVERLAY_STYLE = css`
  z-index: 1;
  padding: ${SPACING.spacing8};
  background-color: ${COLORS.grey60};
  flex-direction: ${DIRECTION_COLUMN};
  color: ${COLORS.white};
  display: flex;
  align-items: ${ALIGN_FLEX_START};
  justify-content: ${JUSTIFY_SPACE_AROUND};
  border-radius: ${BORDERS.borderRadiusSize4};
  bottom: 0;
  font-size: 0.7rem;
  position: ${POSITION_ABSOLUTE};
  width: 127.76px;
  height: 85.45px;
  opacity: 0;
  &:hover {
    opacity: 1;
  }
`

interface EditLabwareOffDeckProps {
  labwareEntity: LabwareEntity
}

export function EditLabwareOffDeck(
  props: EditLabwareOffDeckProps
): JSX.Element {
  const { labwareEntity } = props
  const { t } = useTranslation('deck')
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const allSavedLabware = useSelector(labwareIngredSelectors.getSavedLabware)
  const hasName = allSavedLabware[labwareEntity.id]
  const { isTiprack } = labwareEntity.def.parameters

  const isYetUnnamed = isTiprack && !hasName

  const editLiquids = (): void => {
    dispatch(openIngredientSelector(labwareEntity.id))
  }

  if (isYetUnnamed && !isTiprack) {
    return (
      <div css={NAME_LABWARE_OVERLAY_STYLE}>
        <NameThisLabware
          labwareOnDeck={labwareEntity}
          editLiquids={editLiquids}
        />
      </div>
    )
  } else {
    return (
      <div css={REGULAR_OVERLAY_STYLE}>
        {!isTiprack ? (
          <a className={styles.overlay_button} onClick={editLiquids}>
            <Icon className={styles.overlay_icon} name="pencil" />
            {t('overlay.edit.name_and_liquids')}
          </a>
        ) : (
          <div className={styles.button_spacer} />
        )}
        <a
          className={styles.overlay_button}
          onClick={() => dispatch(duplicateLabware(labwareEntity.id))}
        >
          <Icon className={styles.overlay_icon} name="content-copy" />
          {t('overlay.edit.duplicate')}
        </a>
        <a
          className={styles.overlay_button}
          onClick={() => {
            window.confirm(
              t('warning.cancelForSure', {
                adapterName: getLabwareDisplayName(labwareEntity.def),
              })
            ) && dispatch(deleteContainer({ labwareId: labwareEntity.id }))
          }}
        >
          <Icon className={styles.overlay_icon} name="close" />
          {t('overlay.edit.delete')}
        </a>
      </div>
    )
  }
}
