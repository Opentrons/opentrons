import React from 'react'
import LinkItem from './LinkItem'

export default function LabwareListItem (props) {
  const {
    name,
    slot,
    // confirmed,
    isTiprack,
    instrumentsCalibrated,
    tipracksConfirmed,
    isRunning,
    onClick
  } = props

  const url = isRunning
  ? '#'
  : `/setup-deck/${slot}`

  const isDisabled = !instrumentsCalibrated || !(isTiprack || tipracksConfirmed)

  return (
    <li>
      <LinkItem
        isDisabled={isDisabled}
        onClick={onClick}
        url={url}
      >
        <span>{name}</span>
      </LinkItem>
    </li>
  )
}
