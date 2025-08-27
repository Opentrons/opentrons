import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { COLORS, Icon } from '@opentrons/components'

import styles from './sendbutton.module.css'

interface SendButtonProps {
  handleClick: () => void
  disabled?: boolean
  isLoading?: boolean
}

export function SendButton({
  handleClick,
  disabled = false,
  isLoading = false,
}: SendButtonProps): JSX.Element {
  const { t } = useTranslation('protocol_generator')

  const progressTexts = [
    t('progressInitializing'),
    t('progressProcessing'),
    t('progressGenerating'),
    t('progressFinalizing'),
  ]

  const [buttonText, setButtonText] = useState(progressTexts[0])
  const [, setProgressIndex] = useState(0)

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgressIndex(prevIndex => {
          let newIndex = prevIndex + 1
          if (newIndex > progressTexts.length - 1) {
            newIndex = progressTexts.length - 1
          }
          return newIndex
        })
      }, 10000)

      return () => {
        setProgressIndex(0)
        setButtonText(progressTexts[0])
        clearInterval(interval)
      }
    }
  }, [isLoading])

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-label="Send"
      className={styles.button}
    >
      <Icon name="send" size="1.25rem" color="white" />
      <span className={styles.button_text}>
        {isLoading ? buttonText : t('send')}
      </span>
      {isLoading && (
        <div className={styles.loading_icon}>
          <Icon name="ot-spinner" spin size="1rem" color={COLORS.white} />
        </div>
      )}
    </button>
  )
}
