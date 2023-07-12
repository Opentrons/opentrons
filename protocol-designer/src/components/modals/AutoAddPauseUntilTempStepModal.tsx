import * as React from 'react'
import {
  AlertModal,
  OutlineButton,
  DeprecatedPrimaryButton,
} from '@opentrons/components'
import modalStyles from './modal.css'
import styles from './AutoAddPauseUntilTempStepModal.css'
import type { TFunction } from 'i18next'

interface Props {
  displayTemperature: string
  handleCancelClick: () => unknown
  handleContinueClick: () => unknown
  t: TFunction<'modal', undefined>
}

export const AutoAddPauseUntilTempStepModal = (props: Props): JSX.Element => (
  <AlertModal
    alertOverlay
    className={modalStyles.modal}
    contentsClassName={modalStyles.modal_contents}
  >
    <div className={styles.header}>
      {props.t('auto_add_pause_until_temp_step.title', {
        temperature: props.displayTemperature,
      })}
    </div>
    <p className={styles.body}>
      {props.t('auto_add_pause_until_temp_step.body1', {
        temperature: props.displayTemperature,
      })}
    </p>
    <p className={styles.body}>
      {props.t('auto_add_pause_until_temp_step.body2', {
        temperature: props.displayTemperature,
      })}
    </p>
    <div className={modalStyles.button_row}>
      <OutlineButton
        className={styles.later_button}
        onClick={props.handleCancelClick}
      >
        {props.t('auto_add_pause_until_temp_step.later_button')}
      </OutlineButton>
      <DeprecatedPrimaryButton
        className={styles.now_button}
        onClick={props.handleContinueClick}
      >
        {props.t('auto_add_pause_until_temp_step.now_button')}
      </DeprecatedPrimaryButton>
    </div>
  </AlertModal>
)
