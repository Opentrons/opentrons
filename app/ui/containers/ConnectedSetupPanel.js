import React from 'react'
import {connect} from 'react-redux'

import SetupPanel from '../components/SetupPanel'

const mapStateToProps = (state) => {
  return {
    isInstrumentsConfirmed: true, // all pipettes confirmed ? show labware

    instruments: [
      {
        axis: 'left',
        channels: 'single',
        volume: 200,
        isProbed: true
      },
      {
        axis: 'right',
        channels: 'multi',
        volume: 200,
        isProbed: false
      }
    ],

    isTipracksConfirmed: false, // all tipracks confirmed ? unlock other labware
    isLabwareConfirmed: false, // all labware confirmed ? show run button

    labware: [
      {
        name: 'tiprack',
        slot: 'B1',
        type: 'tiprack-200ul',
        isConfirmed: false,
        isTiprack: true
      }, {
        name: 'tiprack2',
        slot: 'B2',
        type: 'tiprack-200ul',
        isConfirmed: false,
        isTiprack: true
      },
      {
        name: 'trough',
        slot: 'C1',
        type: 'trough-12row',
        isConfirmed: false,
        isTiprack: false
      }, {
        name: 'plate',
        slot: 'D1',
        type: '96-PCR-flat',
        isConfirmed: false,
        isTiprack: false
      }, {
        name: 'tuberack',
        slot: 'D2',
        type: 'tube-rack-2ml',
        isConfirmed: false,
        isTiprack: false
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
