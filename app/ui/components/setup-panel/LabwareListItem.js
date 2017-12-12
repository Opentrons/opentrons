import React from 'react'
import PropTypes from 'prop-types'
import ListItem from './ListItem'

// TODO: condense booleans to some more logical isDisabled selector
LabwareListItem.propTypes = {
  name: PropTypes.string,
  slot: PropTypes.number.isRequired,
  confirmed: PropTypes.bool,
  isTiprack: PropTypes.bool,
  instrumentsCalibrated: PropTypes.bool,
  tipracksConfirmed: PropTypes.bool,
  isRunning: PropTypes.bool.isRequired,
  onClick: PropTypes.func
}

export default function LabwareListItem (props) {
  const {
    name,
    slot,
    confirmed,
    isTiprack,
    instrumentsCalibrated,
    tipracksConfirmed,
    isRunning,
    onClick
  } = props

  const url = isRunning
    ? '#'
    : `/setup-deck/${slot}`

  // TODO(ka 2017-12-12) move this into a selector, fix boolean logic
  const isDisabled = !instrumentsCalibrated || !(isTiprack || tipracksConfirmed) || (isTiprack && confirmed)
  return (
    <ListItem
      isDisabled={isDisabled || isRunning}
      url={url}
      onClick={onClick}
      confirmed={confirmed}
    >
      <span>{name}</span>
    </ListItem>
  )
}
