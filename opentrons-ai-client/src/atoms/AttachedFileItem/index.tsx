import { COLORS, Icon } from '@opentrons/components'

import {
  getFileExtension,
  getFileType,
} from '/ai-client/resources/utils/fileUtils'

import styles from './attachedfileitem.module.css'

interface AttachedFileItemProps {
  file: File | { name: string; type?: string }
  onRemove?: () => void
  showRemoveButton?: boolean
}

export function AttachedFileItem({
  file,
  onRemove,
  showRemoveButton = true,
}: AttachedFileItemProps): JSX.Element {
  const fileType = getFileType(file as File)

  const containerClass = `${styles.container} ${
    showRemoveButton && onRemove != null
      ? styles.container_with_remove
      : styles.container_without_remove
  }`

  const getFileTypeLabel = (type: ReturnType<typeof getFileType>): string => {
    switch (type) {
      case 'pdf':
        return 'PDF file'
      case 'csv':
        return 'CSV file'
      case 'python':
        return 'Python file'
      default:
        return 'Unknown file'
    }
  }

  return (
    <div className={containerClass}>
      <div className={styles.file_icon_container}>
        <div className={styles.file_extension}>
          {getFileExtension(file as File)}
        </div>
      </div>
      <div className={styles.file_details_container}>
        <div className={styles.file_name}>{file.name}</div>
        <div className={styles.file_details}>{getFileTypeLabel(fileType)}</div>
      </div>
      {showRemoveButton && onRemove != null && (
        <button
          onClick={onRemove}
          aria-label={`Remove_${file.name}`}
          className={styles.remove_button}
        >
          <Icon name="close" size="1.75rem" color={COLORS.grey60} />
        </button>
      )}
    </div>
  )
}
