// @flow
import * as React from 'react'

// TODO (ka 2019-2-12): Style this component
export default function ConfigMessage () {
  return (
    <React.Fragment>
      <h3>WARNING:</h3>
      <p>
        These are advanced settings. Please do not attempt to adjust without
        assitance from an Opentrons support team member, as doing so may affect
        the lifespan of your pipette.
      </p>
      <p>
        Note that these settings will not override any pipette settings
        pre-defined in protocols.
      </p>
    </React.Fragment>
  )
}
