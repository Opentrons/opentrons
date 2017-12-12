// upload summary component
import React from 'react'
import PropTypes from 'prop-types'

import CenteredContent from './CenteredContent'
import Splash from './Splash'
import {Spinner, Success, Warning} from './icons'

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
    ? (<Spinner className={styles.spinner} />)
    : (<UploadResults {...props} />)

  return (
    <CenteredContent>
      {content}
    </CenteredContent>
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
        <p className={styles.error}>
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
          {' Prep For Run '}
        </span>
        <span>
          panel to set up your pipettes and labware for the run
        </span>
      </p>
    )
  }

  return (
    <div className={styles.results}>
      <StatusBar success={!error}>
        <span className={styles.status_message}>
          {message}
        </span>
      </StatusBar>
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
  )
}

function StatusBar (props) {
  const {success} = props
  const StatusIcon = success
    ? Success
    : Warning

  return (
    <div className={styles.status_bar}>
      <StatusIcon className={styles.status_icon} />
      {props.children}
    </div>
  )
}
