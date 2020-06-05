// @flow
import * as React from 'react'

import { AlertModal, OutlineButton } from '@opentrons/components'
import { i18n } from '../../../localization'

import styles from './StepChangesConfirmModal.css'
import modalStyles from '../modal.css'

type Props = { onCancel: () => void, onConfirm: () => void }

export const StepChangesConfirmModal = (props: Props): React.Node => {
  const { onCancel, onConfirm } = props

  return (
    <AlertModal
      alertOverlay
      className={modalStyles.modal}
      heading={i18n.t('modal.global_step_changes.heading')}
    >
      <p>{i18n.t('modal.global_step_changes.switch_pipettes.body')}</p>
      <ul className={styles.cause_effect_list}>
        <li className={styles.cause_effect_item}>
          <p className={styles.cause}>
            {i18n.t('modal.global_step_changes.switch_pipettes.cause.any')}
          </p>
          <p>
            {i18n.t('modal.global_step_changes.switch_pipettes.effect.any')}
          </p>
        </li>
        <li className={styles.cause_effect_item}>
          <p className={styles.cause}>
            {i18n.t(
              'modal.global_step_changes.switch_pipettes.cause.multi_to_single'
            )}
          </p>
          <p>
            {i18n.t(
              'modal.global_step_changes.switch_pipettes.effect.multi_to_single'
            )}
          </p>
        </li>
        <li className={styles.cause_effect_item}>
          <p className={styles.cause}>
            {i18n.t(
              'modal.global_step_changes.switch_pipettes.cause.single_to_multi'
            )}
          </p>
          <p>
            {i18n.t(
              'modal.global_step_changes.switch_pipettes.effect.single_to_multi'
            )}
          </p>
        </li>
        <li className={styles.cause_effect_item}>
          <p className={styles.cause}>
            {i18n.t(
              'modal.global_step_changes.switch_pipettes.cause.next_pipette_smaller'
            )}
          </p>
          <p>
            {i18n.t(
              'modal.global_step_changes.switch_pipettes.effect.next_pipette_smaller'
            )}
          </p>
        </li>
      </ul>

      <div className={modalStyles.button_row}>
        <OutlineButton onClick={onCancel}>
          {i18n.t('button.cancel')}
        </OutlineButton>
        <OutlineButton className={styles.continue_button} onClick={onConfirm}>
          {i18n.t('button.continue')}
        </OutlineButton>
      </div>
    </AlertModal>
  )
}
