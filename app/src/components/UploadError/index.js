// @flow
// upload summary component
import * as React from 'react'
import cx from 'classnames'
import {Icon} from '@opentrons/components'

import styles from './styles.css'

const UPLOAD_ERROR_MESSAGE = 'Your protocol could not be opened.'

type Props = {
  name: string,
  uploadError: ?{message: string},
}

export default function UploadStatus (props: Props) {
  const {name, uploadError} = props

  return (
    <div className={styles.container}>
    <div className={styles.results}>
      <StatusIcon />
      <div className={styles.status}>
        <p className={styles.status_message}>
          {UPLOAD_ERROR_MESSAGE}
        </p>
        <div className={styles.details}>
          <h3 className={styles.file_details_title}>
            File details:
          </h3>
          <p>
            Filename: {name}
          </p>
        </div>
        <div className={styles.details}>
          <p className={styles.error_message}>
            {uploadError && (uploadError.message)}
          </p>
          <p>
            Looks like there might be a problem with your protocol file. Please
            check your file for errors. If you need help, contact support
            and provide them with your protocol file and the error message above.
          </p>
        </div>
      </div>
    </div>
    </div>
  )
}

function StatusIcon () {
  const iconClassName = cx(styles.status_icon, styles.error)
  return (
    <Icon name='alert' className={iconClassName} />
  )
}
