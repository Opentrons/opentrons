import React from 'react'
import PropTypes from 'prop-types'
import ListItem from './ListItem'

// TODO: condense booleans to some more logical isDisabled selector
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

  return (
    <ListItem
      isDisabled={isDisabled}
      url={url}
      onClick={onClick}
      confirmed={confirmed}
    >
      <span>{name}</span>
    </ListItem>
  )
}
