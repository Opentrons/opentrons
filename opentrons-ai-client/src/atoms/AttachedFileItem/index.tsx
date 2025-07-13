import { COLORS, Icon } from '@opentrons/components'

import { getFileType } from '/ai-client/resources/utils/fileUtils'

import styles from './AttachedFileItem.module.css'

interface AttachedFileItemProps {
  file: {
    name: string
    size?: number
  }
  onRemove?: () => void
  showRemoveButton?: boolean
}

// Helper to get simple file type labels
const getSimpleFileTypeLabel = (type: string, fileName: string): string => {
  // Check for Python files first
  if (fileName.toLowerCase().endsWith('.py')) {
    return 'Python file'
  }

  switch (type) {
    case 'pdf':
      return 'PDF file'
    case 'csv':
      return 'CSV file'
    case 'image':
      return 'Image file'
    case 'json':
      return 'JSON file'
    default:
      return 'File'
  }
}

// Helper to get file extension for display in the icon container
const getFileExtension = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension != null && extension !== '' ? `.${extension}` : '.file'
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

  return (
    <div className={containerClass}>
      <div className={styles.file_icon_container}>
        <div className={styles.file_extension}>
          {getFileExtension(file.name)}
        </div>
      </div>
      <div className={styles.file_details_container}>
        <div className={styles.file_name}>{file.name}</div>
        <div className={styles.file_details}>
          {getSimpleFileTypeLabel(fileType, file.name)}
        </div>
      </div>
      {showRemoveButton && onRemove != null && (
        <button
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
          className={styles.remove_button}
        >
          <Icon name="close" size="1.75rem" color={COLORS.grey60} />
        </button>
      )}
    </div>
  )
}
