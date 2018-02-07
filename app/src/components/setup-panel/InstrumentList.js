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

export default withRouter(connect(mapStateToProps)(InstrumentList))

const TITLE = 'Pipette Setup'

function InstrumentList (props: Props) {
  const {instruments, isRunning} = props

  return (
    <TitledList title={TITLE}>
      {robotConstants.INSTRUMENT_MOUNTS.map((mount) => {
        const inst = instruments.find((i) => i.mount === mount) || {mount}

        return (
          <InstrumentListItem
            key={inst.mount}
            isRunning={isRunning}
            {...inst}
          />
        )
      })}
    </TitledList>
  )
}

function mapStateToProps (state): Props {
  return {
    instruments: robotSelectors.getInstruments(state),
    isRunning: robotSelectors.getIsRunning(state)
  }
}
