// @flow
import * as React from 'react'
import cx from 'classnames'

import {
  getLabwareDisplayName,
  getModuleDisplayName,
  type ModuleType,
} from '@opentrons/shared-data'
import { ListItem, HoverTooltip } from '@opentrons/components'
import styles from './styles.css'

import type { Labware } from '../../robot'
import { THERMOCYCLER } from '../../modules'

export type LabwareListItemProps = {|
  ...Labware,
  moduleName?: ModuleType,
  isDisabled: boolean,
  onClick: () => mixed,
|}

export function LabwareListItem(props: LabwareListItemProps) {
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
    moduleName,
  } = props

  const url = `/calibrate/labware/${slot}`
  const iconName = confirmed ? 'check-circle' : 'checkbox-blank-circle-outline'
  const displayName = definition ? getLabwareDisplayName(definition) : type
  let displaySlot = `Slot ${slot}`
  if (moduleName === THERMOCYCLER) {
    displaySlot = 'Slots 7, 8, 10, & 11'
  }
  const moduleDisplayName = moduleName && getModuleDisplayName(moduleName)

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
          <LabwareNameTooltip
            name={name}
            displayName={
              moduleDisplayName
                ? `${displayName} on ${moduleDisplayName}`
                : displayName
            }
          />
        }
      >
        {handlers => (
          <div {...handlers} className={styles.item_info}>
            <span className={styles.item_info_location}>{displaySlot}</span>
            {isTiprack && (
              <span className={styles.tiprack_item_mount}>
                {calibratorMount && calibratorMount.charAt(0).toUpperCase()}
              </span>
            )}
            <div className={styles.slot_contents_names}>
              {moduleName && (
                <span className={styles.module_name}>{moduleDisplayName}</span>
              )}
              <span className={styles.labware_item_name}>{displayName}</span>
            </div>
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
