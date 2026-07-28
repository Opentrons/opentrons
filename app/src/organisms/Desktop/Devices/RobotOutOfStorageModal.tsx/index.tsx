import { useTranslation } from 'react-i18next'

import {
  COLORS,
  Icon,
  Modal,
  PrimaryButton,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'

import styles from './robotoutofstoragemodal.module.css'

import type React from 'react'

interface RobotOutOfStorageModalProps {
  onConfirm: () => void
  onClose: () => void
}

export function RobotOutOfStorageModal(
  props: RobotOutOfStorageModalProps
): React.ReactNode {
  const { onConfirm, onClose } = props
  const { t } = useTranslation('device_details')
  return (
    <Modal
      type="warning"
      title={t('robot_storage_almost_full')}
      onClose={onClose}
      footer={
        <div className={styles.footer}>
          <SecondaryButton onClick={onClose}>{t('cancel')}</SecondaryButton>
          <PrimaryButton onClick={onConfirm}>{t('manage_files')}</PrimaryButton>
        </div>
      }
    >
      <div className={styles.modal_content}>
        <Icon size="2.5rem" name="ot-alert" color={COLORS.yellow50} />
        <div className={styles.text_container}>
          <StyledText desktopStyle="headingSmallBold">
            {t('file_storage_full')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {t('delete_to_run')}
          </StyledText>
        </div>
      </div>
    </Modal>
  )
}
