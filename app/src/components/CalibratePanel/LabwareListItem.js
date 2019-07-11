// @flow
import * as React from 'react'
import cx from 'classnames'

import { getLabwareDisplayName } from '@opentrons/shared-data'
import { ListItem, HoverTooltip } from '@opentrons/components'
import styles from './styles.css'

import type { Labware } from '../../robot'

type LabwareListItemProps = {|
  ...$Exact<Labware>,
  isDisabled: boolean,
  onClick: () => mixed,
|}

export default function LabwareListItem(props: LabwareListItemProps) {
  const {
    name,
    type,
    slot,
    calibratorMount,
    isTiprack,
    confirmed,
    isDisabled,
    onClick,
    definition,
  } = props

  const url = `/calibrate/labware/${slot}`
  const iconName = confirmed ? 'check-circle' : 'checkbox-blank-circle-outline'
  const displayName = definition ? getLabwareDisplayName(definition) : type

  return (
    <ListItem
      url={!isDisabled ? url : undefined}
      onClick={!isDisabled ? onClick : undefined}
      iconName={iconName}
      className={cx({ [styles.disabled]: isDisabled })}
      activeClassName={styles.active}
    >
      <HoverTooltip
        tooltipComponent={
          <LabwareNameTooltip name={name} displayName={displayName} />
        }
      >
        {handlers => (
          <div {...handlers} className={styles.item_info}>
            <span className={styles.item_info_location}>Slot {slot}</span>
            {isTiprack && (
              <span className={styles.tiprack_item_mount}>
                {calibratorMount && calibratorMount.charAt(0).toUpperCase()}
              </span>
            )}

            <span className={styles.labware_item_name}>{displayName}</span>
          </div>
        )}
      </HoverTooltip>
    </ListItem>
  )
}

function LabwareNameTooltip(props: {| name: string, displayName: string |}) {
  const { name, displayName } = props

  return (
    <div className={styles.item_info_tooltip}>
      <p>{name}</p>
      <p>{displayName}</p>
    </div>
  )
}
