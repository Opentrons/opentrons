// @flow
import * as React from 'react'

import {AlertModal, OutlineButton} from '@opentrons/components'
import i18n from '../../../localization'

import styles from './EditPipettesModal.css'
import modalStyles from '../modal.css'

type Props = {onCancel: () => void, onConfirm: () => void}

const StepChangesWarningModal = (props: Props) => {
  const {onCancel, onConfirm} = props

  return (
    <AlertModal
      type='warning'
      alertOverlay
      className={modalStyles.modal}
      heading={i18n.t('modal.global_step_changes.heading')}>
      <p className={styles.modal_section_header}>{i18n.t('modal.global_step_changes.all_steps_header')}</p>
      <p>{i18n.t('modal.global_step_changes.all_steps_cleared_settings')}</p>
      <p className={styles.modal_section_header}>{i18n.t('modal.global_step_changes.other_potential_changes_header')}</p>
      <div className={styles.effect_row}>
        <p>{i18n.t('modal.global_step_changes.multi_to_single')}</p>
        <p>{i18n.t('modal.global_step_changes.selected_wells_cleared')}</p>
      </div>
      <div className={styles.effect_row}>
        <p>{i18n.t('modal.global_step_changes.single_to_multi')}</p>
        <p>{i18n.t('modal.global_step_changes.tip_use_may_increase')}</p>
      </div>
      <div className={styles.effect_row}>
        <p>{i18n.t('modal.global_step_changes.next_pipette_smaller')}</p>
        <p>{i18n.t('modal.global_step_changes.tip_use_may_increase')}</p>
      </div>
      <div className={styles.effect_row}>
        <p>{i18n.t('modal.global_step_changes.next_tip_size_smaller')}</p>
        <p>{i18n.t('modal.global_step_changes.tip_use_may_increase')}</p>
      </div>

      <div className={styles.button_row}>

        <OutlineButton
          className={styles.ok_button}
          onClick={onCancel}>
          {i18n.t('button.cancel')}
        </OutlineButton>
        <OutlineButton
          className={styles.ok_button}
          onClick={onConfirm}>
          {i18n.t('button.ok')}
        </OutlineButton>
      </div>
    </AlertModal>
  )
}

export default StepChangesWarningModal
