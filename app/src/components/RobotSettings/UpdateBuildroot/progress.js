// @flow
import * as React from 'react'
import styles from './styles.css'

export function ProgressSpinner(): React.Node {
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

export type ProgressBarProps = {|
  progress: number | null,
|}

export function ProgressBar(props: ProgressBarProps): React.Node {
  const progress = props.progress || 0
  const width = `${progress}%`

  return (
    <div className={styles.progress_bar_container}>
      <span className={styles.progress_text}>{progress}%</span>
      <div style={{ width: width }} className={styles.progress_bar} />
    </div>
  )
}
