import React from 'react'
import {connect} from 'react-redux'

import SetupPanel from '../components/SetupPanel'

const mapStateToProps = (state) => {
  return {
    instruments: [
      {
        axis: 'left',
        channels: 'single',
        volume: 200,
        isProbed: false
      },
      {
        axis: 'right',
        channels: 'multi',
        volume: 200,
        isProbed: false
      }
    ],
    labware: [
      {
        name: 'tiprack',
        slot: 'B1',
        type: 'tiprack-200ul',
        isConfirmed: false
      }, {
        name: 'tiprack2',
        slot: 'B2',
        type: 'tiprack-200ul',
        isConfirmed: true
      }
    ]
  }
}

function ConnectedSetupPanel (props) {
  return (
    <SetupPanel {...props} />
  )
}

export default connect(mapStateToProps)(ConnectedSetupPanel)
