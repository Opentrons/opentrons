// @flow
import * as React from 'react'

import type {Labware} from '../../robot'

import {ListItem} from '@opentrons/components'
import styles from './styles.css'

type LabwareItemProps = {
  isDisabled: boolean,
  onClick?: () => void,
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
    onClick,
  } = props

  const url = `/calibrate/labware/${slot}`
  const iconName = confirmed
    ? 'check-circle'
    : 'checkbox-blank-circle-outline'

  return (
    <ListItem
      isDisabled={isDisabled}
      url={url}
      onClick={onClick}
      iconName={iconName}
      activeClassName={styles.active}
    >
      <div className={styles.item_info}>
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
      </div>
    </ListItem>
  )
}
