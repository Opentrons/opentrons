// upload summary component
import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import {PANEL_PROPS_BY_NAME} from '../interface'

import {Icon, ALERT, CHECKED, SPINNER} from '@opentrons/components'
import Splash from './Splash'

import styles from './Upload.css'

const UPLOAD_ERROR_MESSAGE = 'Your protocol could not be opened.'
const UPLOAD_SUCCESS_MESSAGE = 'Your protocol has successfully loaded.'

Upload.propTypes = {
  name: PropTypes.string.isRequired,
  inProgress: PropTypes.bool.isRequired,
  openSetupPanel: PropTypes.func.isRequired,
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
    ? (<Icon name={SPINNER} spin className={styles.status_icon} />)
    : (<UploadResults {...props} />)

  return (
    <div className={styles.container}>
      {content}
    </div>
  )
}

function UploadResults (props) {
  const {name, error, openSetupPanel} = props
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
        <span>Use the</span>
        <span
          role='button'
          onClick={openSetupPanel}
          className={styles.open_setup_link}
        >
          {` ${PANEL_PROPS_BY_NAME.setup.title} `}
        </span>
        <span>
          panel to set up your pipettes and labware for the run
        </span>
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
    ? CHECKED
    : ALERT

  return (
    <Icon name={iconName} className={iconClassName} />
  )
}
