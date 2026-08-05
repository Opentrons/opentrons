import { useTranslation } from 'react-i18next'

import { COLORS, StyledText } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'

import styles from './confirmdeletealllogperiodsmodal.module.css'

interface ConfirmDeleteAllLogPeriodsModalProps {
  onDownloadAll: () => void
  onConfirmDelete: () => void
  onClose: () => void
}

export function ConfirmDeleteAllLogPeriodsModal({
  onDownloadAll,
  onConfirmDelete,
  onClose,
}: ConfirmDeleteAllLogPeriodsModalProps): JSX.Element {
  const { t } = useTranslation('device_details')

  return (
    <OddModal
      header={{
        title: t('delete_all_log_periods'),
        iconName: 'ot-alert',
        iconColor: COLORS.yellow50,
      }}
      onOutsideClick={onClose}
    >
      <div className={styles.content}>
        <div className={styles.description}>
          <StyledText oddStyle="bodyTextRegular">
            {t('delete_all_log_periods_description')}
          </StyledText>
          <StyledText oddStyle="bodyTextRegular">
            {t('delete_all_log_periods_recommendation')}
          </StyledText>
        </div>
        <div className={styles.buttons}>
          <SmallButton
            flex="1"
            buttonText={t('download_all_log_periods')}
            iconName="download"
            onClick={onDownloadAll}
          />
          <SmallButton
            flex="1"
            buttonType="alert"
            buttonText={t('delete_all_log_periods_title')}
            onClick={onConfirmDelete}
          />
        </div>
      </div>
    </OddModal>
  )
}
