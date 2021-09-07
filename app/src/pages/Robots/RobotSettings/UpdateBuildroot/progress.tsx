import * as React from 'react'
import styles from './styles.css'

export function ProgressSpinner(): JSX.Element {
  return (
    <div className={styles.progress_spinner}>
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  )
}

export interface ProgressBarProps {
  progress: number | null
}

export function ProgressBar(props: ProgressBarProps): JSX.Element {
  const progress = props.progress || 0
  const width = `${progress}%`

  return (
    <div className={styles.progress_bar_container}>
      <span className={styles.progress_text}>{progress}%</span>
      <div style={{ width: width }} className={styles.progress_bar} />
    </div>
  )
}
