import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon } from '@opentrons/components'

import styles from './codeblocktoolbar.module.css'

interface CodeBlockToolbarProps {
  code: string
}

const COPY_FEEDBACK_DURATION_MS = 2000

export function CodeBlockToolbar({ code }: CodeBlockToolbarProps): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      setTimeout(() => {
        setIsCopied(false)
      }, COPY_FEEDBACK_DURATION_MS)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleDownload = (): void => {
    try {
      const blob = new Blob([code], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)

      const now = new Date()
      const timestamp = now
        .toISOString()
        .replace(/[-:]/g, '')
        .replace('T', '_')
        .slice(0, 13) // YYYYMMDD_HHMM

      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `OpentronsAI_${timestamp}.py`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)

      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download code:', err)
    }
  }

  return (
    <div className={styles.copy_button_container}>
      <span className={styles.language_badge}>Python</span>
      <div className={styles.button_group}>
        <button
          className={styles.copy_button}
          onClick={() => {
            void handleCopy()
          }}
          title={isCopied ? t('copied') : t('copy_code')}
        >
          <Icon name={isCopied ? 'check' : 'content-copy'} size="1rem" />
        </button>
        <button
          className={styles.copy_button}
          onClick={handleDownload}
          title={t('download')}
        >
          <Icon name="download" size="1rem" />
        </button>
      </div>
    </div>
  )
}
