import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

import { Icon, StyledText } from '@opentrons/components'

import styles from './copybutton.module.css'

import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import type { IconName } from '@opentrons/components'

type BaseButtonProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'onClick' | 'children'
>

const DISPLAY_DURATION_MS = 3000

type CopyState = 'idle' | 'copied'

interface CopyButtonProps extends BaseButtonProps {
  /** The text string to be copied to the clipboard */
  value: string
  /** aria-label for accessibility (Highly recommended for icon-only variant) */
  'aria-label': string
  /** Button text label optional. If omitted, becomes "icon only" variant automatically */
  label?: string
  /** Success text after copying the button (Required for i18n support) */
  successLabel?: string
}

export function CopyButton(props: CopyButtonProps): ReactNode {
  const {
    value,
    'aria-label': ariaLabel,
    label,
    successLabel,
    className,
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
      timeoutIdRef.current = setTimeout(() => {
        setCopyState('idle')
      }, DISPLAY_DURATION_MS)
    } catch (error) {
      console.error('Failed to copy text: ', error)
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

  const buttonClasses = clsx(styles.copy_button, className)
  const containerClasses = clsx(
    label === undefined
      ? styles.container_without_text
      : styles.container_with_text
  )

  return (
    <button
      onClick={() => {
        void handleCopy()
      }}
      className={buttonClasses}
      aria-label={ariaLabel}
      {...restProps}
    >
      <div className={containerClasses}>
        <Icon name={currentIconName} className={styles.icon_style} />
        {label !== undefined ? (
          <StyledText desktopStyle="bodyDefaultRegular">
            {currentLabel}
          </StyledText>
        ) : null}
      </div>
    </button>
  )
}
