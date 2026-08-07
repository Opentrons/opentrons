import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  Icon,
  ModalShell,
  PrimaryButton,
  SecondaryButton,
  StyledText,
  WizardHeader,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'

import styles from './userAccountForm.module.css'

import type { JSX } from 'react'

export interface UserAccountConfirmModalProps {
  title: string
  heading: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  isConfirmDisabled?: boolean
}

export function UserAccountConfirmModal({
  title,
  heading,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  isConfirmDisabled = false,
}: UserAccountConfirmModalProps): JSX.Element {
  const { t } = useTranslation('shared')

  return createPortal(
    <ModalShell
      width="31.25rem"
      header={
        <WizardHeader
          title={title}
          onExit={onCancel}
          hideStepText
          exitButtonCopy={t('exit') as string}
          exitDisabled={isConfirmDisabled}
        />
      }
    >
      <div className={styles.modal_content}>
        <div className={styles.form_fields}>
          <div className={styles.confirm_intro}>
            <Icon
              name="information"
              size="1.25rem"
              className={styles.confirm_icon}
            />
            <div className={styles.confirm_text}>
              <StyledText desktopStyle="headingSmallBold">{heading}</StyledText>
              <StyledText desktopStyle="bodyDefaultRegular">
                {description}
              </StyledText>
            </div>
          </div>
          <div className={styles.actions}>
            <SecondaryButton type="button" onClick={onCancel}>
              {t('cancel') as string}
            </SecondaryButton>
            <PrimaryButton
              type="button"
              disabled={isConfirmDisabled}
              onClick={onConfirm}
            >
              {confirmLabel}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </ModalShell>,
    getTopPortalEl()
  )
}
