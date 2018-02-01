import * as React from 'react'
import {ListItem, CHECKED, UNCHECKED} from '@opentrons/components'

export default function LabwareListItem (props) {
  const {
    name,
    slot,
    confirmed,
    isDisabled,
    onClick
  } = props

  const url = isDisabled
    ? '#'
    : `/setup-deck/${slot}`

  const iconName = confirmed
    ? CHECKED
    : UNCHECKED

  return (
    <ListItem
      isDisabled={isDisabled}
      url={url}
      onClick={onClick}
      iconName={iconName}
    >
      <span>{name}</span>
    </ListItem>
  )
}
