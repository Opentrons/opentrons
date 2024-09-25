import cx from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { LegacyModal } from '@opentrons/components'

import * as wellContentsSelectors from '../../top-selectors/well-contents'
import { selectors } from '../../labware-ingred/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
import * as labwareIngredsActions from '../../labware-ingred/actions'
import { BrowsableLabware } from './BrowsableLabware'

import modalStyles from '../modals/modal.module.css'
import styles from './labware.module.css'

export const BrowseLabwareModal = (): JSX.Element | null => {
  const { t } = useTranslation('modal')
  const dispatch = useDispatch()
  const labwareId = useSelector(selectors.getDrillDownLabwareId)
  const labwareEntities = useSelector(stepFormSelectors.getLabwareEntities)
  const allWellContentsForActiveItem = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
  )
  const ingredNames = useSelector(selectors.getLiquidNamesById)
  const definition = labwareId ? labwareEntities[labwareId]?.def : null
  const wellContents =
    labwareId && allWellContentsForActiveItem
      ? allWellContentsForActiveItem[labwareId]
      : null

  if (!definition) {
    console.assert(definition, 'BrowseLabwareModal expected definition')
    return null
  }

  return (
    <LegacyModal
      className={modalStyles.modal}
      contentsClassName={cx(
        modalStyles.modal_contents,
        modalStyles.transparent_content
      )}
      onCloseClick={() => dispatch(labwareIngredsActions.drillUpFromLabware())}
    >
      <BrowsableLabware
        definition={definition}
        ingredNames={ingredNames}
        wellContents={wellContents}
      />
      <div className={styles.modal_instructions}>
        {t('browse_labware.instructions')}
      </div>
    </LegacyModal>
  )
}
