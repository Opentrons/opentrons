// RobotSettings card for wifi status
import * as React from 'react'
import InstrumentInfo from './InstrumentInfo'
import {Card} from '@opentrons/components'

const TITLE = 'Pipettes'

export default function AttachedInstrumentsCard (props) {
  // TODO (ka 2018-3-14): not sure where this will be comining from in state so mocking it up for styling purposes
  // here I am assuming they key and  mount will always exist and some sort of presence of a pipette indicator will affect InstrumentInfo
  // delete channels and volume in either elft or right to view value and button message change
  // apologies for the messy logic, hard to anticipate what is returned just yet
  const attachedInstruments = {
    left: {
      mount: 'left',
      channels: 8,
      volume: 300
    },
    right: {
      mount: 'right',
      channels: 1,
      volume: 10
    }
  }

  return (
    <Card title={TITLE} >
      <InstrumentInfo {...attachedInstruments.left}/>
      <InstrumentInfo {...attachedInstruments.right} />
    </Card>
  )
}
