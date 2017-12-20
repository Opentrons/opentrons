import React from 'react'
import PropTypes from 'prop-types'
import capitalize from 'lodash/capitalize'

import ListItem from './ListItem'

InstrumentListItem.propTypes = {
  isRunning: PropTypes.bool.isRequired,
  name: PropTypes.string,
  axis: PropTypes.string,
  volume: PropTypes.number,
  channels: PropTypes.string,
  probed: PropTypes.bool,
  onClick: PropTypes.func
}

export default function InstrumentListItem (props) {
  const {isRunning, name, axis, volume, channels, probed, isActive, setInstrument} = props
  const isDisabled = name == null
  const url = isRunning
  ? '#'
  : `/setup-instruments/${axis}`

  const confirmed = probed

  const description = !isDisabled
    ? `${capitalize(channels)}-channel`
    : 'N/A'

  const units = !isDisabled ? 'ul' : null
  return (
    <ListItem
      isDisabled={isDisabled || isRunning}
      url={url}
      onClick={!isRunning && setInstrument}
      confirmed={confirmed}
      active={isActive}
    >
      <span>{axis}</span>
      <span>{description}</span>
      <span>{volume} {units}</span>
    </ListItem>
  )
}
