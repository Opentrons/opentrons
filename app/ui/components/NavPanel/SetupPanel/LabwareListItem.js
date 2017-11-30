import React from 'react'
import LinkItem from './LinkItem'

export default function LabwareListItem (props) {
  const {
    name,
    slot,
    confirmed,
    isTiprack,
    instrumentsCalibrated,
    tipracksConfirmed,
    isRunning,
    moveToLabware
  } = props

  const url = isRunning
  ? '#'
  : `/setup-deck/${slot}`

  const isDisabled = !instrumentsCalibrated || !(isTiprack || tipracksConfirmed)

  return (
    <li>
      <LinkItem
        isDisabled={isDisabled}
        url={url}
        onClick={moveToLabware}
        confirmed={confirmed}
      >
        <span>{name}</span>
      </LinkItem>
    </li>
  )
}
