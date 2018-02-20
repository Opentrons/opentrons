// @flow
import React from 'react'
import {connect} from 'react-redux'
import {withRouter} from 'react-router'

import {
  constants as robotConstants,
  selectors as robotSelectors,
  type Instrument
} from '../../robot'

import {TitledList} from '@opentrons/components'
import InstrumentListItem from './InstrumentListItem'

type Props = {
  instruments: Instrument[],
  isRunning: bool,
}

const TITLE = 'Pipette Calibration'

export default withRouter(connect(mapStateToProps)(InstrumentList))

function InstrumentList (props: Props) {
  const {instruments, isRunning} = props

  return (
    <TitledList title={TITLE}>
      {robotConstants.INSTRUMENT_MOUNTS.map((mount) => (
        <InstrumentListItem
          key={mount}
          mount={mount}
          isRunning={isRunning}
          instrument={instruments.find((i) => i.mount === mount)}
        />
      ))}
    </TitledList>
  )
}

function mapStateToProps (state): Props {
  return {
    instruments: robotSelectors.getInstruments(state),
    isRunning: robotSelectors.getIsRunning(state)
  }
}
