import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  Icon,
  ModalHeader,
  ModalShell,
  PrimaryButton,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'

import styles from './useraccountconfirmmodal.module.css'

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
      header={<ModalHeader title={title} onClose={onCancel} />}
    >
      <div className={styles.content}>
        <div className={styles.body}>
          <Icon name="ot-alert" size="2.5rem" color={COLORS.yellow50} />
          <div className={styles.body_text}>
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
    </ModalShell>,
    getTopPortalEl()
  )
}
