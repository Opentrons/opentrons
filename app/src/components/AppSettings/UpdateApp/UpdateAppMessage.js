// @flow

import * as React from 'react'

import styles from './styles.css'

type UpdateAppMessageProps = {|
  downloaded?: boolean,
|}

const UPDATE_MESSAGE = (
  <p className={styles.update_message}>
    We recommend that you update to the latest version. <br />
    Please note the following:
  </p>
)

const RESTART_MESSAGE = (
  <p className={styles.update_message}>
    Restart your app to complete the update. <br />
    Please note the following:
  </p>
)

export function UpdateAppMessage(props: UpdateAppMessageProps): React.Node {
  const message = props.downloaded ? RESTART_MESSAGE : UPDATE_MESSAGE
  return (
    <React.Fragment>
      {message}

      <p className={styles.update_message}>
        1) After updating your app, we recommend you update your robot version
        to ensure the app and robot versions are in sync.
      </p>

      <p className={styles.update_message}>
        2) If you are using more than one computer to operate your robot, please
        update the app on those computers as well.
      </p>
    </React.Fragment>
  )
}
