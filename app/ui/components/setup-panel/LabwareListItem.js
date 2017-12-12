import React from 'react'
import ListItem from './ListItem'

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
