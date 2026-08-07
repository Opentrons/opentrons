import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  ModalShell,
  PrimaryButton,
  SecondaryButton,
  WizardHeader,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { SimpleWizardBody } from '/app/molecules/SimpleWizardBody'

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
      <SimpleWizardBody
        iconColor={COLORS.yellow50}
        header={heading}
        subHeader={description}
        isSuccess={false}
      >
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
      </SimpleWizardBody>
    </ModalShell>,
    getTopPortalEl()
  )
}
