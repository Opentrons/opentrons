// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'

export default function UpdateAppMessage () {
  return (
    <p>
      There is an app update available. Please <Link to={'/menu/app/update'}>update your app</Link> to receive the latest robot updates.
    </p>
  )
}
