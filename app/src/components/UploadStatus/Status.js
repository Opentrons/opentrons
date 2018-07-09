// @flow
// upload summary component
import * as React from 'react'
import cx from 'classnames'
import {Link} from 'react-router-dom'

import {Icon, Splash} from '@opentrons/components'

import styles from './styles.css'

const UPLOAD_ERROR_MESSAGE = 'Your protocol could not be opened.'
const UPLOAD_SUCCESS_MESSAGE = 'Your protocol has successfully loaded.'

type Props = {
  name: string,
  uploadInProgress: boolean,
  uploadError: ?{message: string},
  protocolRunning: boolean,
  protocolDone: boolean,
}

export default function Status (props: Props) {
  const {name, uploadInProgress, uploadError} = props

  // display splash if nothing is happening
  if (!name && !uploadInProgress && !uploadError) {
    return (<Splash />)
  }

  const content = uploadInProgress
    ? (<Icon name='ot-spinner' spin className={styles.status_icon} />)
    : (<UploadResults {...props} />)

  return (
    <div className={styles.container}>
      {content}
    </div>
  )
}

function UploadResults (props: Props) {
  const {name, uploadError, protocolRunning, protocolDone} = props
  const message = uploadError
    ? UPLOAD_ERROR_MESSAGE
    : UPLOAD_SUCCESS_MESSAGE

  let instructions

  console.log(props)

  if (uploadError) {
    // instructions for an unsuccessful upload
    instructions = (
      <div className={styles.details}>
        <p className={styles.error_message}>
          {uploadError.message}
        </p>
        <p>
          Looks like there might be a problem with your protocol file. Please
          check your file for errors. If you need help, contact support
          and provide them with your protocol file and the error message above.
        </p>
      </div>
    )
  } else if (protocolRunning || protocolDone) {
    // instructions while protocol is running
    instructions = (
      <p className={styles.details}>
        <span>{'Continue to '}</span>
        <Link to='/run'>Run</Link>
        <span>{' to view progress of the current protocol run'}</span>
      </p>
    )
  } else {
    // instructions for a successful upload
    instructions = (
      <p className={styles.details}>
        <span>{'Continue to '}</span>
        <Link to='/calibrate'>Calibrate</Link>
        <span>{' to set up your pipettes and labware for the run'}</span>
      </p>
    )
  }

  return (
    <div className={styles.results}>
      <StatusIcon success={!uploadError} />
      <div className={styles.status}>
        <p className={styles.status_message}>
          {message}
        </p>
        <div className={styles.details}>
          <h3 className={styles.file_details_title}>
            File details:
          </h3>
          <p>
            Filename: {name}
          </p>
        </div>
        {instructions}
      </div>
    </div>
  )
}

function StatusIcon (props: {success: boolean}) {
  const {success} = props
  const iconClassName = cx(styles.status_icon, {
    [styles.success]: success,
    [styles.error]: !success
  })

  const iconName = success
    ? 'check-circle'
    : 'alert'

  return (
    <Icon name={iconName} className={iconClassName} />
  )
}
