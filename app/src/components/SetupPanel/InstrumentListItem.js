// @flow
import React from 'react'
import capitalize from 'lodash/capitalize'

import {
  ListItem,
  CHECKED,
  UNCHECKED,
  type
  IconName
} from '@opentrons/components'

import type {Mount, Instrument} from '../../robot'

type Props = {
  isRunning: boolean,
  mount: Mount,
  instrument: ?Instrument
}

export default function InstrumentListItem (props: Props) {
  const {isRunning, mount, instrument} = props
  const confirmed = instrument && instrument.probed
  const isDisabled = !instrument || isRunning
  const url = !isDisabled
    ? `/setup-instruments/${mount}`
    : '#'

  const iconName: IconName = confirmed
    ? CHECKED
    : UNCHECKED

  const description = instrument
    ? `${capitalize(instrument.channels === 8 ? 'multi' : 'single')}-channel`
    : 'N/A'

  const name = instrument
    ? instrument.name
    : 'N/A'

  return (
    <ListItem
      isDisabled={isDisabled}
      url={url}
      confirmed={confirmed}
      iconName={iconName}
    >
      <span>{capitalize(mount)}</span>
      <span>{description}</span>
      <span>{name}</span>
    </ListItem>
  )
}
