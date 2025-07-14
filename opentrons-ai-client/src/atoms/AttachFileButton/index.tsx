import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon } from '@opentrons/components'

import styles from './AttachFileButton.module.css'

const ACCEPT_EXTENSION = '.pdf,.csv,.py'

interface AttachFileButtonProps {
  onFileSelect: (files: FileList) => void
  disabled?: boolean
}

export function AttachFileButton({
  onFileSelect,
  disabled = false,
}: AttachFileButtonProps): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = (): void => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files)
      // Reset input to allow re-selecting same file
      e.target.value = ''
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={t('attach_file')}
        className={styles.button}
      >
        <Icon name="paper-clip" size="1rem" />
        <span className={styles.button_text}>{t('attach_file')}</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPT_EXTENSION}
        onChange={handleFileChange}
        className={styles.hidden_input}
      />
    </>
  )
}
