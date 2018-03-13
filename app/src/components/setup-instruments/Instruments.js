// @flow
import * as React from 'react'
import capitalize from 'lodash/capitalize'

import type {Instrument} from '../../robot'
import {constants as robotConstants} from '../../robot'

import {InstrumentGroup} from '@opentrons/components'

type Props = {
  instruments: Array<Instrument>,
  currentInstrument: ?Instrument
}

export default function Instruments (props: Props) {
  const {currentInstrument, instruments: allInstruments} = props
  const currentMount = currentInstrument
    ? currentInstrument.mount
    : null

  // TODO(mc, 2018-03-07): refactor when InstrumentGroup switches to object
  //   of instruments keyed by mount instead of array
  const instruments = robotConstants.INSTRUMENT_MOUNTS.map((mount) => {
    const inst = allInstruments.find((i) => i.mount === mount)
    const isDisabled = !inst || mount !== currentMount

    const description = inst
      ? `${capitalize(`${inst.channels}`)}-channel (${inst.volume} ul)`
      : 'N/A'

    const tipType = inst
      ? `${inst.volume} ul`
      : 'N/A'

    return {
      ...(inst || {mount}),
      isDisabled,
      description,
      tipType
    }
  })

  const left = instruments.find(i => i.mount === 'left')
  const right = instruments.find(i => i.mount === 'right')

  return (
    <InstrumentGroup {...{left, right}} />
  )
}
