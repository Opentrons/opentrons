import styles from './sleepscreen.module.css'

interface SleepScreenProps {
  'aria-label': string
}

export function SleepScreen({
  'aria-label': ariaLabel,
}: SleepScreenProps): JSX.Element {
  return (
    <div
      className={styles.container}
      role="button"
      aria-label={ariaLabel}
    ></div>
  )
}
