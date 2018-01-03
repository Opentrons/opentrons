import React from 'react'
import PropTypes from 'prop-types'
import {ListItem, CHECKED, UNCHECKED} from '@opentrons/components'

LabwareListItem.propTypes = {
  name: PropTypes.string,
  slot: PropTypes.number.isRequired,
  confirmed: PropTypes.bool,
  isDisabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func
}

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
