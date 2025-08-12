import { useState } from 'react'

import { Icon, SPACING } from '@opentrons/components'

import styles from './enhancedmarkdown.module.css'

interface CodeBlockToolbarProps {
  code: string
}

export function CodeBlockToolbar({ code }: CodeBlockToolbarProps): JSX.Element {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
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
          title={isCopied ? 'Copied!' : 'Copy code'}
        >
          <Icon
            name={isCopied ? 'check' : 'content-copy'}
            size={SPACING.spacing16}
          />
        </button>
        <button
          className={styles.copy_button}
          onClick={handleDownload}
          title="Download as .py file"
        >
          <Icon name="download" size={SPACING.spacing16} />
        </button>
      </div>
    </div>
  )
}
