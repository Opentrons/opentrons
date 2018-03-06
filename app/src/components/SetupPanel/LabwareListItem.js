// @flow
import * as React from 'react'

import type {Labware} from '../../robot'

import {ListItem, CHECKED, UNCHECKED} from '@opentrons/components'
import styles from './styles.css'

type LabwareItemProps = {
  isDisabled: boolean,
  onClick?: () => void
}

type Props = Labware & LabwareItemProps

export default function LabwareListItem (props: Props) {
  const {
    type,
    slot,
    calibratorMount,
    isTiprack,
    confirmed,
    isDisabled,
    onClick
  } = props

  const url = `/setup-deck/${slot}`
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
      <span>Slot {slot}</span>
      {isTiprack && (
        <span>
          <span className={styles.tiprack_item_mount}>
            {calibratorMount && calibratorMount.charAt(0).toUpperCase()}
          </span>
          Tiprack
        </span>
      )}
      <span>
        {type}
      </span>
    </ListItem>
  )
}
