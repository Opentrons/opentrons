// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'
import styles from './styles.css'

export default function UpdateAppMessage () {
  return (
    <p className={styles.update_message}>
      <strong>A newer version of the robot software is available.</strong> To update your robot to the latest version, please <Link to={'/menu/app/update'}>update your app software</Link> before updating your robot software.
    </p>
  )
}
