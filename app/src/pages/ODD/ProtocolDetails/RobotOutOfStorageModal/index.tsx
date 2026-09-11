import { useTranslation } from 'react-i18next'

import { COLORS, StorageBar, StyledText } from '@opentrons/components'
import { useHealth } from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'

import styles from './robotoutofstoragemodal.module.css'

import type { ReactNode } from 'react'

interface RobotOutOfStorageModalProps {
  onConfirm: () => void
  onClose: () => void
}

export function RobotOutOfStorageModal(
  props: RobotOutOfStorageModalProps
): ReactNode {
  const { onConfirm, onClose } = props

  const { t } = useTranslation('device_details')

  const health = useHealth()

  const totalMb = health?.disk_details?.systemTotalMb ?? 0
  const availableMb = health?.disk_details?.systemAvailableMb ?? 0
  const percentUsed =
    totalMb > 0 ? Math.round(((totalMb - availableMb) / totalMb) * 100) : 0

  return (
    <OddModal
      header={{
        title: t('robot_storage_almost_full'),
        iconName: 'ot-alert',
        iconColor: COLORS.yellow50,
      }}
    >
      <div className={styles.body}>
        <StyledText oddStyle="bodyTextRegular">{t('delete_to_run')}</StyledText>
        <StorageBar label={t('file_capacity')} percentUsed={percentUsed} />
        <div className={styles.footer}>
          <SmallButton
            buttonType="secondary"
            buttonText={t('cancel')}
            onClick={onClose}
            width="100%"
          />
          <SmallButton
            buttonType="primary"
            buttonText={t('manage_files')}
            onClick={onConfirm}
            width="100%"
          />
        </div>
      </div>
    </OddModal>
  )
}
