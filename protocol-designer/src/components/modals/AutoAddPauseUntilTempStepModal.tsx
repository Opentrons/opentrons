import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertModal,
  OutlineButton,
  DeprecatedPrimaryButton,
} from '@opentrons/components'
import modalStyles from './modal.css'
import styles from './AutoAddPauseUntilTempStepModal.css'

interface Props {
  displayTemperature: string
  handleCancelClick: () => unknown
  handleContinueClick: () => unknown
}

export const AutoAddPauseUntilTempStepModal = (props: Props): JSX.Element => {
  const { t } = useTranslation('modal')
  return (
    <AlertModal
      alertOverlay
      className={modalStyles.modal}
      contentsClassName={modalStyles.modal_contents}
    >
      <div className={styles.header}>
        {t('auto_add_pause_until_temp_step.title', {
          temperature: props.displayTemperature,
        })}
      </div>
      <p className={styles.body}>
        {t('auto_add_pause_until_temp_step.body1', {
          temperature: props.displayTemperature,
        })}
      </p>
      <p className={styles.body}>
        {t('auto_add_pause_until_temp_step.body2', {
          temperature: props.displayTemperature,
        })}
      </p>
      <div className={modalStyles.button_row}>
        <OutlineButton
          className={styles.later_button}
          onClick={props.handleCancelClick}
        >
          {t('auto_add_pause_until_temp_step.later_button')}
        </OutlineButton>
        <DeprecatedPrimaryButton
          className={styles.now_button}
          onClick={props.handleContinueClick}
        >
          {t('auto_add_pause_until_temp_step.now_button')}
        </DeprecatedPrimaryButton>
      </div>
    </AlertModal>
  )
}
