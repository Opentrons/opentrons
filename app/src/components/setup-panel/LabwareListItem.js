// @flow
import * as React from 'react'
import {ListItem, CHECKED, UNCHECKED} from '@opentrons/components'
import capitalize from 'lodash/capitalize'
import {
  type Labware
} from '../../robot'

type LabwareItemProps = {
  confirmed?: boolean,
  isDisabled: boolean,
  setLabware?: () => void
}

type Props = Labware & LabwareItemProps

export default function LabwareListItem (props: Props) {
  const {
    name,
    slot,
    calibratorMount,
    isTiprack,
    confirmed,
    isDisabled,
    setLabware
  } = props

  const url = `/setup-deck/${slot}`
  const label = capitalize(name.replace('-', ' '))
  const mount = isTiprack && calibratorMount
    ? capitalize(calibratorMount.charAt(0))
    : ''
  const iconName = confirmed
    ? CHECKED
    : UNCHECKED

  return (
    <ListItem
      isDisabled={isDisabled}
      url={url}
      onClick={setLabware}
      iconName={iconName}
    >
      <span>Slot {slot}</span>
      <span>{label}</span>
      <span>{mount}</span>
    </ListItem>
  )
}
