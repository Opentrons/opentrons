import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertModal, OutlineButton } from '@opentrons/components'

import styles from './StepChangesConfirmModal.css'
import modalStyles from '../modal.css'

interface Props {
  onCancel: () => void
  onConfirm: () => void
}

export const StepChangesConfirmModal = (props: Props): JSX.Element => {
  const { onCancel, onConfirm } = props
  const { t } = useTranslation(['modal', 'button'])
  return (
    <AlertModal
      alertOverlay
      className={modalStyles.modal}
      heading={t('global_step_changes.heading')}
    >
      <p>{t('global_step_changes.switch_pipettes.body')}</p>
      <ul className={styles.cause_effect_list}>
        <li className={styles.cause_effect_item}>
          <p className={styles.cause}>
            {t('global_step_changes.switch_pipettes.cause.any')}
          </p>
          <p>{t('global_step_changes.switch_pipettes.effect.any')}</p>
        </li>
        <li className={styles.cause_effect_item}>
          <p className={styles.cause}>
            {t('global_step_changes.switch_pipettes.cause.multi_to_single')}
          </p>
          <p>
            {t('global_step_changes.switch_pipettes.effect.multi_to_single')}
          </p>
        </li>
        <li className={styles.cause_effect_item}>
          <p className={styles.cause}>
            {t('global_step_changes.switch_pipettes.cause.single_to_multi')}
          </p>
          <p>
            {t('global_step_changes.switch_pipettes.effect.single_to_multi')}
          </p>
        </li>
        <li className={styles.cause_effect_item}>
          <p className={styles.cause}>
            {t(
              'global_step_changes.switch_pipettes.cause.next_pipette_smaller'
            )}
          </p>
          <p>
            {t(
              'global_step_changes.switch_pipettes.effect.next_pipette_smaller'
            )}
          </p>
        </li>
      </ul>

      <div className={modalStyles.button_row}>
        <OutlineButton onClick={onCancel}>{t('button:cancel')}</OutlineButton>
        <OutlineButton className={styles.continue_button} onClick={onConfirm}>
          {t('button:continue')}
        </OutlineButton>
      </div>
    </AlertModal>
  )
}
