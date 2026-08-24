import { useTranslation } from 'react-i18next'

import { BasicButton, StyledText } from '@opentrons/components'

import styles from './robotsettingsfilemanager.module.css'

import type { ReactNode } from 'react'

interface FileManagementSectionHeaderProps {
  titleText: string
  showButtons: boolean
  onDownloadSelected: () => void
  onDeleteSelected?: () => void
}

export function FileManagementSectionHeader(
  props: FileManagementSectionHeaderProps
): ReactNode {
  const { titleText, onDownloadSelected, onDeleteSelected, showButtons } = props
  const { t } = useTranslation('device_details')
  return (
    <div className={styles.file_management_header}>
      <StyledText desktopStyle="bodyLargeSemiBold">{titleText}</StyledText>
      {showButtons ? (
        <div className={styles.file_management_header_button_group}>
          <BasicButton onClick={onDownloadSelected} iconName="download">
            {t('download_selected')}
          </BasicButton>
          {onDeleteSelected != null ? (
            <BasicButton onClick={onDeleteSelected}>
              {t('delete_selected')}
            </BasicButton>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
