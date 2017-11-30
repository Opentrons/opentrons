import React from 'react'
import capitalize from 'lodash/capitalize'

import LinkItem from './LinkItem'

export default function InstrumentListItem (props) {
  const {isRunning, name, axis, volume, channels, probed} = props
  const isDisabled = name == null
  const url = isRunning
  ? '#'
  : `/setup-instruments/${axis}`
  const confirmed = isDisabled || probed

  const description = !isDisabled
    ? `${capitalize(channels)}-channel`
    : 'N/A'
  const units = !isDisabled ? 'ul' : null
  return (
    <li>
      <LinkItem
        isDisabled={isDisabled}
        url={url}
        confirmed={confirmed}
      >
        <span>{axis}</span>
        <span>{description}</span>
        <span>{volume} {units}</span>
      </LinkItem>
    </li>
  )
}
