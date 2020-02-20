// @flow
// upload summary component
import * as React from 'react'
import { Icon } from '@opentrons/components'

import styles from './styles.css'

const UPLOAD_ERROR_MESSAGE = 'Your protocol could not be opened.'

export type UploadErrorProps = {|
  uploadError: { message: string },
|}

export function UploadError(props: UploadErrorProps) {
  const { uploadError } = props

  return (
    <section className={styles.results}>
      <Icon name="alert" className={styles.error_icon} />
      <div className={styles.status}>
        <p className={styles.status_message}>{UPLOAD_ERROR_MESSAGE}</p>
        <div className={styles.details}>
          <p className={styles.error_message}>{uploadError.message}</p>
          <p>
            It looks like there might be a problem with your protocol file.
            Please check your file for errors. If you need help, contact support
            and provide them with your protocol file and the error message
            above.
          </p>
        </div>
      </div>
    </section>
  )
}
