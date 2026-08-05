import { useTranslation } from 'react-i18next'

import { COLORS, StyledText } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'

import styles from './confirmdeleteallrunrecordsmodal.module.css'

interface ConfirmDeleteAllRunRecordsModalProps {
  onDownloadAll: () => void
  onConfirmDelete: () => void
  onClose: () => void
}

export function ConfirmDeleteAllRunRecordsModal({
  onDownloadAll,
  onConfirmDelete,
  onClose,
}: ConfirmDeleteAllRunRecordsModalProps): JSX.Element {
  const { t } = useTranslation('device_details')

  return (
    <OddModal
      header={{
        title: t('delete_all_run_records'),
        iconName: 'ot-alert',
        iconColor: COLORS.yellow50,
      }}
      onOutsideClick={onClose}
    >
      <div className={styles.content}>
        <div className={styles.description}>
          <StyledText oddStyle="bodyTextRegular">
            {t('delete_all_run_records_description')}
          </StyledText>
          <StyledText oddStyle="bodyTextRegular">
            {t('delete_all_run_records_recommendation')}
          </StyledText>
        </div>
        <div className={styles.buttons}>
          <SmallButton
            flex="1"
            buttonText={t('download_all_protocol_files')}
            iconName="download"
            onClick={onDownloadAll}
          />
          <SmallButton
            flex="1"
            buttonType="alert"
            buttonText={t('delete_all_protocol_records')}
            onClick={onConfirmDelete}
          />
        </div>
      </div>
    </OddModal>
  )
}
