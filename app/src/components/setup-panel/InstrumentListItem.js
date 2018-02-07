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

import type {Mount, Channels} from '../../robot'

type Props = {
  isRunning: boolean,
  mount: Mount,
  name: ?string,
  volume: ?number,
  channels: ?Channels,
  probed: ?boolean,
}

export default function InstrumentListItem (props: Props) {
  const {
    isRunning,
    name,
    mount,
    volume,
    channels,
    probed
  } = props

  const isUsed = name != null
  const isDisabled = !isUsed || isRunning

  const url = !isDisabled
    ? `/setup-instruments/${mount}`
    : '#'

  // TODO (ka 2018-1-17): Move this up to container mergeProps in upcoming update setup panel ticket
  const confirmed = probed

  const iconName: IconName = confirmed
    ? CHECKED
    : UNCHECKED

  const pipetteType = channels === 8
    ? 'multi'
    : 'single'

  const description = isUsed
    ? `${capitalize(pipetteType)}-channel`
    : 'N/A'

  const units = !isDisabled
    ? 'ul'
    : null

  return (
    <ListItem
      isDisabled={isDisabled}
      url={url}
      confirmed={confirmed}
      iconName={iconName}
    >
      <span>{capitalize(mount)}</span>
      <span>{description}</span>
      <span>{volume} {units}</span>
    </ListItem>
  )
}
