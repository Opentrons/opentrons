import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  Modal,
  PrimaryButton,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'

import styles from './userAccount/userAccountForm.module.css'

import type { JSX } from 'react'

export interface DeleteUserConfirmModalProps {
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteUserConfirmModal({
  onConfirm,
  onCancel,
}: DeleteUserConfirmModalProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])

  return createPortal(
    <Modal
      type="warning"
      title={t('desktop_delete_user_modal_title')}
      onClose={onCancel}
    >
      <div className={styles.form_fields}>
        <StyledText desktopStyle="headingSmallBold">
          {t('desktop_delete_user_modal_heading') as string}
        </StyledText>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('desktop_delete_user_modal_description') as string}
        </StyledText>
        <div className={styles.actions}>
          <SecondaryButton type="button" onClick={onCancel}>
            {t('shared:cancel') as string}
          </SecondaryButton>
          <PrimaryButton type="button" onClick={onConfirm}>
            {t('shared:delete') as string}
          </PrimaryButton>
        </div>
      </div>
    </Modal>,
    getTopPortalEl()
  )
}
