import styles from './sleepscreen.module.css'

import type { ReactNode } from 'react'

interface SleepScreenProps {
  'aria-label': string
}

export function SleepScreen({
  'aria-label': ariaLabel,
}: SleepScreenProps): ReactNode {
  return (
    <div
      className={styles.container}
      role="button"
      aria-label={ariaLabel}
    ></div>
  )
}
