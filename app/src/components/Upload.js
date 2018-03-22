// upload summary component
import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import {Link} from 'react-router-dom'

import {Icon, Splash} from '@opentrons/components'

import styles from './Upload.css'

const UPLOAD_ERROR_MESSAGE = 'Your protocol could not be opened.'
const UPLOAD_SUCCESS_MESSAGE = 'Your protocol has successfully loaded.'

Upload.propTypes = {
  name: PropTypes.string.isRequired,
  inProgress: PropTypes.bool.isRequired,
  error: PropTypes.shape({
    message: PropTypes.string.isRequired
  })
}

export default function Upload (props) {
  const {name, inProgress, error} = props

  // display splash if nothing is happening
  if (!name && !inProgress && !error) {
    return (<Splash />)
  }

  const content = inProgress
    ? (<Icon name='ot-spinner' spin className={styles.status_icon} />)
    : (<UploadResults {...props} />)

  return (
    <div className={styles.container}>
      {content}
    </div>
  )
}

function UploadResults (props) {
  const {name, error} = props
  const message = error
    ? UPLOAD_ERROR_MESSAGE
    : UPLOAD_SUCCESS_MESSAGE

  let instructions

  if (error) {
    // instructions for an unsuccessful upload
    instructions = (
      <div className={styles.details}>
        <p className={styles.error_message}>
          {error.message}
        </p>
        <p>
          Looks like there might be a problem with your protocol file. Please
          check your file for errors. If you need help, contact support
          and provide them with your protocol file and the error message above.
        </p>
      </div>
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
      <StatusIcon success={!error} />
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

function StatusIcon (props) {
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
