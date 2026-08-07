import { useTranslation } from 'react-i18next'

import { Icon, MenuItem, MenuList, StyledText } from '@opentrons/components'

import styles from './confirmrunrecordmodal.module.css'

import type { ReactNode } from 'react'

interface ConfirmRunRecordModalProps {
  onDownload: () => void
  onDelete: () => void
  onClose: () => void
}

export function ConfirmRunRecordModal({
  onDownload,
  onDelete,
  onClose,
}: ConfirmRunRecordModalProps): ReactNode {
  const { t } = useTranslation('device_details')

  return (
    <MenuList isOnDevice onClick={onClose}>
      <div className={styles.buttons}>
        <MenuItem onClick={onDownload} className={styles.menu_item}>
          <Icon name="download" size="2.5rem" />
          <StyledText oddStyle="bodyTextRegular">
            {t('download_protocol_files')}
          </StyledText>
        </MenuItem>
        <MenuItem onClick={onDelete} className={styles.menu_item} isAlert>
          <Icon name="trash" size="2.5rem" />
          <StyledText oddStyle="bodyTextRegular">
            {t('delete_protocol_files')}
          </StyledText>
        </MenuItem>
      </div>
    </MenuList>
  )
}
