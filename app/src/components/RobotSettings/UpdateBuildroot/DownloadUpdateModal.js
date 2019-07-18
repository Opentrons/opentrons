// @flow
// Placeholder modal for missing/downloading/errored update files

import * as React from 'react'
import { AlertModal } from '@opentrons/components'
import styles from './styles.css'
import type { ButtonProps } from '@opentrons/components'

type Props = {|
  notNowButton: ButtonProps,
  error: string | null,
  progress: number | null,
|}

const HEADING = 'Robot System Update'
export default function DownloadUpdate(props: Props) {
  const { notNowButton, error, progress } = props

  let message

  const progressMessage = (
    <div className={styles.system_update_modal}>
      <p className={styles.download_message}>
        Robot update download in progress...
      </p>
      <ProgressBar progress={progress} />
      <p>
        Please keep app connected to the internet until the download is
        complete.
      </p>
    </div>
  )

  if (progress) {
    message = progressMessage
  } else if (error) {
    message = (
      <div className={styles.system_update_modal}>
        <p className={styles.download_message}>
          There was an error downloading robot update files:
        </p>
        <p className={styles.download_error}>{error}</p>
        <p>To download this update you must be connected to the internet.</p>
      </div>
    )
  } else {
    message = progressMessage
  }
  return (
    <AlertModal heading={HEADING} buttons={[notNowButton]} alertOverlay>
      {message}
    </AlertModal>
  )
}

type ProgressBarProps = {
  progress: number | null,
}

function ProgressBar(props: ProgressBarProps) {
  const { progress } = props
  const width = progress && `${progress}%`
  return (
    <div className={styles.progress_bar_container}>
      <span className={styles.progress_text}>{progress}%</span>
      <div style={{ width: width }} className={styles.progress_bar} />
    </div>
  )
}
