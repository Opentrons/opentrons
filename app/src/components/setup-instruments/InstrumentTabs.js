// @flow
// instrument tabs bar container
// used for left/right pipette selection during pipette calibration
import * as React from 'react'

import type {Instrument} from '../../robot'
import {constants as robotConstants} from '../../robot'

import {PageTabs} from '@opentrons/components'

type Props = {
  instruments: Array<Instrument>,
  currentInstrument: ?Instrument
}

export default function InstrumentTabs (props: Props) {
  const {instruments, currentInstrument} = props

  const pages = robotConstants.INSTRUMENT_MOUNTS.map((mount) => ({
    title: mount,
    href: `/calibrate/instruments/${mount}`,
    isActive: currentInstrument != null && mount === currentInstrument.mount,
    isDisabled: !instruments.some((inst) => inst.mount === mount)
  }))

  return (
    <PageTabs pages={pages} />
  )
}
