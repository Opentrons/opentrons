// @flow
import * as React from 'react'
import { AlertModal, OutlineButton, PrimaryButton } from '@opentrons/components'
import { i18n } from '../../localization'
import modalStyles from './modal.css'
import styles from './AutoAddPauseUntilTempStepModal.css'

type Props = {|
  displayTemperature: string,
  handleCancelClick: () => mixed,
  handleContinueClick: () => mixed,
|}

export const AutoAddPauseUntilTempStepModal = (props: Props): React.Node => (
  <AlertModal
    className={modalStyles.modal}
    contentsClassName={modalStyles.modal_contents}
  >
    <div className={styles.header}>
      {i18n.t('modal.auto_add_pause_until_temp_step.title', {
        temperature: props.displayTemperature,
      })}
    </div>
    <p className={styles.body}>
      {i18n.t('modal.auto_add_pause_until_temp_step.body1', {
        temperature: props.displayTemperature,
      })}
    </p>
    <p className={styles.body}>
      {i18n.t('modal.auto_add_pause_until_temp_step.body2', {
        temperature: props.displayTemperature,
      })}
    </p>
    <div className={modalStyles.button_row}>
      <OutlineButton
        className={styles.later_button}
        onClick={props.handleCancelClick}
      >
        {i18n.t('modal.auto_add_pause_until_temp_step.later_button')}
      </OutlineButton>
      <PrimaryButton
        className={styles.now_button}
        onClick={props.handleContinueClick}
      >
        {i18n.t('modal.auto_add_pause_until_temp_step.now_button')}
      </PrimaryButton>
    </div>
  </AlertModal>
)
