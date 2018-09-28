// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'

export default function UpdateAppMessage () {
  return (
    <p>
      <strong>A newer version of the robot software is available.</strong> To update your robot to the latest version, please <Link to={'/menu/app/update'}>update your app software</Link> before updating your robot software.
    </p>
  )
}
