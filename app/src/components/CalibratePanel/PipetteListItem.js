// @flow
import React from 'react'
import capitalize from 'lodash/capitalize'

import {
  ListItem,
  type IconName,
} from '@opentrons/components'

import type {Mount, Pipette} from '../../robot'
import styles from './styles.css'

type Props = {
  isRunning: boolean,
  mount: Mount,
  pipette: ?Pipette,
}

export default function PipetteListItem (props: Props) {
  const {isRunning, mount, pipette} = props
  const confirmed = pipette && pipette.probed
  const isDisabled = !pipette || isRunning
  const url = !isDisabled
    ? `/calibrate/pipettes/${mount}`
    : '#'

  const iconName: IconName = confirmed
    ? 'check-circle'
    : 'checkbox-blank-circle-outline'

  const description = pipette
    ? `${capitalize(pipette.channels === 8 ? 'multi' : 'single')}-channel`
    : 'N/A'

  const name = pipette
    ? pipette.name
    : 'N/A'

  return (
    <ListItem
      isDisabled={isDisabled}
      url={url}
      confirmed={confirmed}
      iconName={iconName}
      activeClassName={styles.active}
    >
      <div className={styles.item_info}>
        <span>{capitalize(mount)}</span>
        <span>{description}</span>
        <span>{name}</span>
      </div>
    </ListItem>
  )
}
