import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

import { Icon } from '../../icons'
import styles from './copyactionbutton.module.css'

import type { ComponentPropsWithoutRef } from 'react'
import type { IconName } from '../../icons'

type BaseButtonProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'onClick' | 'children'
>

const DISPLAY_DURATION_MS = 3000

type CopyState = 'idle' | 'copied'

interface CopyActionButtonProps extends BaseButtonProps {
  /** The text string to be copied to the clipboard */
  value: string
  /** aria-label for accessibility (Highly recommended for icon-only variant) */
  'aria-label': string
  /** Button text label optional. If omitted, becomes "icon only" variant automatically */
  label?: string
  /** Success text after copying the button (Required for i18n support) */
  successLabel: string
}

export function CopyActionButton(props: CopyActionButtonProps): JSX.Element {
  const {
    value,
    'aria-label': ariaLabel,
    label,
    successLabel,
    ...restProps
  } = props

  const [copyState, setCopyState] = useState<CopyState>('idle')
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)

  const handleCopy = async (): Promise<void> => {
    if (copyState !== 'idle') {
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setCopyState('copied')
    } catch (error) {
      console.error('Failed to copy text: ', error)
    } finally {
      timeoutIdRef.current = setTimeout(() => {
        setCopyState('idle')
      }, DISPLAY_DURATION_MS)
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current != null) {
        clearTimeout(timeoutIdRef.current)
      }
    }
  }, [])

  const currentIconName: IconName =
    copyState === 'copied' ? 'check' : 'copy-text'
  const currentLabel = copyState === 'copied' ? successLabel : label

  const buttonClasses = clsx(styles.copy_action_button)
  const containerClasses = clsx(
    label === undefined
      ? styles.container_without_text
      : styles.container_with_text
  )

  return (
    <button
      onClick={() => {
        void handleCopy
      }}
      className={buttonClasses}
      aria-label={ariaLabel}
      {...restProps}
    >
      <div className={containerClasses}>
        <Icon name={currentIconName} className={styles.icon_style} />
        {label !== undefined ? (
          <span className={styles.button_text}>{currentLabel}</span>
        ) : null}
      </div>
    </button>
  )
}
