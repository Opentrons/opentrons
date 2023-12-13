import * as React from 'react'
import {
  AlertModal,
  OutlineButton,
  DeprecatedPrimaryButton,
} from '@opentrons/components'
import { i18n } from '../../localization'
import modalStyles from './modal.module.css'
import styles from './AutoAddPauseUntilTempStepModal.module.css'

interface Props {
  displayTemperature: string
  handleCancelClick: () => unknown
  handleContinueClick: () => unknown
}

export const AutoAddPauseUntilHeaterShakerTempStepModal = (
  props: Props
): JSX.Element => (
  <AlertModal
    alertOverlay
    className={modalStyles.modal}
    contentsClassName={modalStyles.modal_contents}
  >
    <div className={styles.header}>
      {i18n.t('modal.auto_add_pause_until_temp_step.heater_shaker_title', {
        temperature: props.displayTemperature,
      })}
    </div>
    <p className={styles.body}>
      {i18n.t('modal.auto_add_pause_until_temp_step.body1', {
        temperature: props.displayTemperature,
      })}
    </p>
    <p className={styles.body}>
      {i18n.t(
        'modal.auto_add_pause_until_temp_step.heater_shaker_pause_later',
        {
          temperature: props.displayTemperature,
        }
      )}
    </p>
    <div className={modalStyles.button_row}>
      <OutlineButton
        className={styles.later_button}
        onClick={props.handleCancelClick}
      >
        {i18n.t('modal.auto_add_pause_until_temp_step.later_button')}
      </OutlineButton>
      <DeprecatedPrimaryButton
        className={styles.now_button}
        onClick={props.handleContinueClick}
      >
        {i18n.t('modal.auto_add_pause_until_temp_step.now_button')}
      </DeprecatedPrimaryButton>
    </div>
  </AlertModal>
)
