import * as React from 'react'
import assert from 'assert'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'
import * as labwareIngredActions from '../../../labware-ingred/actions'
import { PDTitledList, PDListItem } from '../../lists'
import { EditableTextField } from '../../EditableTextField'
import styles from './labwareDetailsCard.module.css'
import type { ThunkDispatch } from '../../../types'

export function LabwareDetailsCard(): JSX.Element {
  const { t } = useTranslation('form')
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const labwareNicknamesById = useSelector(
    uiLabwareSelectors.getLabwareNicknamesById
  )
  const labwareId = useSelector(labwareIngredSelectors.getSelectedLabwareId)
  const labwareEntities = useSelector(stepFormSelectors.getLabwareEntities)
  const labwareDefDisplayName =
    labwareId != null
      ? getLabwareDisplayName(labwareEntities[labwareId].def)
      : null

  assert(
    labwareId,
    'Expected labware id to exist in connected labware details card'
  )

  const renameLabware = (name: string): void => {
    assert(
      labwareId,
      'renameLabware in LabwareDetailsCard expected a labwareId'
    )

    if (labwareId) {
      dispatch(
        labwareIngredActions.renameLabware({
          labwareId: labwareId,
          name,
        })
      )
    }
  }

  return (
    <PDTitledList title="labware details" iconName="flask-outline">
      <PDListItem>
        <div className={styles.row}>
          <span className={cx(styles.label, styles.column_1_3)}>
            {t('generic.labware_type')}
          </span>
          <span className={styles.column_2_3}>{labwareDefDisplayName}</span>
        </div>
      </PDListItem>
      <PDListItem border>
        <div className={styles.row}>
          <span className={cx(styles.label, styles.column_1_3)}>
            {t('generic.nickname')}
          </span>
          <EditableTextField
            value={labwareNicknamesById[labwareId] ?? 'Unnamed Labware'}
            saveEdit={renameLabware}
          />
        </div>
      </PDListItem>
    </PDTitledList>
  )
}
