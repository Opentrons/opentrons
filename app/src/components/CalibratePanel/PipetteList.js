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
import PipetteListItem from './PipetteListItem'

type Props = {
  instruments: Instrument[],
  isRunning: boolean,
}

const TITLE = 'Pipette Calibration'

export default withRouter(connect(mapStateToProps)(PipetteList))

function PipetteList (props: Props) {
  const {instruments, isRunning} = props

  return (
    <TitledList title={TITLE}>
      {robotConstants.INSTRUMENT_MOUNTS.map((mount) => (
        <PipetteListItem
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
