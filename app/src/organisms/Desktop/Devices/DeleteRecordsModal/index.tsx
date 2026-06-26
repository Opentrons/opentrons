import { useTranslation } from 'react-i18next'

import {
  AlertPrimaryButton,
  Modal,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'

import styles from './deleterecordsmodal.module.css'
import { useDeleteRecordsText } from './hooks/useDeleteRecordsText'

interface DeleteRecordsModalProps {
  onClose: () => void
  onConfirm: () => void
  type: 'allRuns' | 'selectedRuns' | 'allLogs'
}

export function DeleteRecordsModal(
  props: DeleteRecordsModalProps
): JSX.Element {
  const { onClose, onConfirm, type } = props
  const { t } = useTranslation(['device_details', 'shared'])
  const { title, description, recommendation } = useDeleteRecordsText(type)

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
          <AlertPrimaryButton onClick={onConfirm}>
            {t('delete_all')}
          </AlertPrimaryButton>
        </div>
      </div>
    </Modal>
  )
}
