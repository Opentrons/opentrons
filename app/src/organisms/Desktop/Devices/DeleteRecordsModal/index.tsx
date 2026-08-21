import { useTranslation } from 'react-i18next'

import {
  Modal,
  PrimaryButton,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'

import styles from './deleterecordsmodal.module.css'

import type { DeleteRecordsType } from './types'

interface DeleteRecordsModalProps {
  onClose: () => void
  onConfirm: () => void
  type: DeleteRecordsType
}

export function DeleteRecordsModal(
  props: DeleteRecordsModalProps
): JSX.Element {
  const { onClose, onConfirm, type } = props
  const { t } = useTranslation(['device_details', 'shared'])
  const { title, description, recommendation } = ((): {
    title: string
    description: string
    recommendation: string
  } => {
    switch (type) {
      case 'allRuns':
        return {
          title: t('device_details:delete_all_run_records'),
          description: t('device_details:delete_all_run_records_description'),
          recommendation: t(
            'device_details:delete_all_run_records_recommendation'
          ),
        }
      case 'selectedRuns':
        return {
          title: t('device_details:delete_selected_run_records'),
          description: t(
            'device_details:delete_selected_run_records_description'
          ),
          recommendation: t(
            'device_details:delete_selected_run_records_recommendation'
          ),
        }
      case 'selectedLogs':
        return {
          title: t('device_details:delete_selected_logs'),
          description: t('device_details:delete_selected_logs_description'),
          recommendation: t(
            'device_details:delete_selected_logs_recommendation'
          ),
        }
    }
  })()

  return (
    <Modal type="warning" title={title} onClose={onClose}>
      <div className={styles.modal_content}>
        <div className={styles.description}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {description}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            {recommendation}
          </StyledText>
        </div>
        <div className={styles.button_row}>
          <SecondaryButton onClick={onClose}>
            {t('shared:cancel')}
          </SecondaryButton>
          <PrimaryButton variant="warning" onClick={onConfirm}>
            {t('delete_all')}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  )
}
