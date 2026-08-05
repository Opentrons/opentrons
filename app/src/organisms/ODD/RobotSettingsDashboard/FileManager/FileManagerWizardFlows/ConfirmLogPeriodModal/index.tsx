import { useTranslation } from 'react-i18next'

import { Icon, MenuItem, MenuList, StyledText } from '@opentrons/components'

import styles from './confirmlogperiodmodal.module.css'

interface ConfirmLogPeriodModalProps {
  onDownload: () => void
  onDelete: () => void
  onClose: () => void
}

export function ConfirmLogPeriodModal({
  onDownload,
  onDelete,
  onClose,
}: ConfirmLogPeriodModalProps): JSX.Element {
  const { t } = useTranslation('device_details')

  return (
    <MenuList isOnDevice onClick={onClose}>
      <div className={styles.buttons}>
        <MenuItem onClick={onDownload} className={styles.menu_item}>
          <Icon name="download" size="2.5rem" />
          <StyledText oddStyle="bodyTextRegular">
            {t('download_log_period')}
          </StyledText>
        </MenuItem>
        <MenuItem onClick={onDelete} className={styles.menu_item} isAlert>
          <Icon name="trash" size="2.5rem" />
          <StyledText oddStyle="bodyTextRegular">
            {t('delete_log_period')}
          </StyledText>
        </MenuItem>
      </div>
    </MenuList>
  )
}
