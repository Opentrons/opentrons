// @flow
import * as React from 'react'
import styles from './styles.css'

// TODO (ka 2019-2-12): Add intercom onClick to assitance text
export default function ConfigMessage () {
  return (
    <React.Fragment>
      <h3 className={styles.warning_title}>Warning:</h3>
      <p className={styles.warning_text}>
        These are advanced settings. Please do not attempt to adjust without
        assitance from an Opentrons support team member, as doing so may affect
        the lifespan of your pipette.
      </p>
      <p className={styles.warning_text}>
        Note that these settings will not override any pipette settings
        pre-defined in protocols.
      </p>
    </React.Fragment>
  )
}
