import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  ModalShell,
  PrimaryButton,
  StyledText,
  WizardHeader,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'

import {
  ADD_USER_WIZARD_ONE_TIME_PASSWORD_STEP,
  ADD_USER_WIZARD_TOTAL_STEPS,
} from './constants'
import styles from './userAccountForm.module.css'

import type { JSX } from 'react'

export interface OneTimePasswordModalProps {
  password: string
  message: string
  onConfirm: () => void
  onClose: () => void
}

export function OneTimePasswordModal({
  password,
  message,
  onConfirm,
  onClose,
}: OneTimePasswordModalProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])

  return createPortal(
    <ModalShell
      width="31.25rem"
      header={
        <WizardHeader
          title={t('desktop_add_user')}
          onExit={onClose}
          currentStep={ADD_USER_WIZARD_ONE_TIME_PASSWORD_STEP}
          totalSteps={ADD_USER_WIZARD_TOTAL_STEPS}
          hideStepText
          exitButtonCopy={t('shared:exit')}
        />
      }
    >
      <div className={styles.modal_content}>
        <div className={styles.form_fields}>
          <div className={styles.success_intro}>
            <StyledText desktopStyle="headingSmallBold">
              {t('desktop_one_time_password') as string}
            </StyledText>
            <StyledText desktopStyle="bodyDefaultRegular">{message}</StyledText>
          </div>
          <div className={styles.field_group}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('desktop_one_time_password') as string}
            </StyledText>
            <div className={styles.one_time_password_value}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {password}
              </StyledText>
            </div>
          </div>
          <div className={styles.actions}>
            <PrimaryButton type="button" onClick={onConfirm}>
              {t('shared:confirm') as string}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </ModalShell>,
    getTopPortalEl()
  )
}
