// @flow
import React from 'react'
import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  type Mount,
  type Channels
} from '../../robot'

import {TitledList} from '@opentrons/components'
import InstrumentListItem from './InstrumentListItem'

type Props = {
  instruments: {
    mount: Mount,
    name?: string,
    volume?: number,
    channels?: Channels,
    probed?: boolean,
  }[],
  isRunning: bool,
}

export default connect(mapStateToProps)(InstrumentList)

const TITLE = 'Pipette Setup'

function InstrumentList (props: Props) {
  const {instruments, isRunning} = props

  return (
    <TitledList title={TITLE}>
      {instruments.map((inst) => (
        <InstrumentListItem
          key={inst.mount}
          isRunning={isRunning}
          {...inst}
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
