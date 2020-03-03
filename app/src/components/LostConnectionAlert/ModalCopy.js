// @flow
import * as React from 'react'
import { Switch, Route } from 'react-router-dom'

import styles from './styles.css'

export function ModalCopy() {
  return (
    <div className={styles.copy}>
      <p>
        {
          "We can't seem to communicate with your robot right now. Please double check your USB or WiFi connection, and then try to reconnect."
        }
      </p>
      <p>
        <Switch>
          <Route
            path="/upload"
            render={() =>
              "If you've uploaded a protocol to your robot, it should re-open when you reconnect."
            }
          />
          <Route
            path="/calibrate"
            render={() => 'Calibration progress has been lost.'}
          />
          <Route
            path="/run"
            render={() =>
              'If your robot is still running, it will complete the protocol, and you may track its progress once you reconnect.'
            }
          />
          <Route
            render={() =>
              "If you've just unplugged or turned off your robot on purpose, you may ignore this message."
            }
          />
        </Switch>
      </p>
    </div>
  )
}
