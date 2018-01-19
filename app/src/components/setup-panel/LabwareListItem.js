// @flow
import React from 'react'
import {ListItem, CHECKED, UNCHECKED} from '@opentrons/components'

type Props = {
  slot: string,
  isDisabled: boolean,
  onClick: () => void,
  name: ?string,
  confirmed: ?boolean
}

export default function LabwareListItem (props: Props) {
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
