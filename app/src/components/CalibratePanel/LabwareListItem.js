// @flow
import * as React from 'react'
import cx from 'classnames'

import {
  getLabwareDisplayName,
  getModuleDisplayName,
  getModuleType,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { ListItem, HoverTooltip } from '@opentrons/components'
import { CalibrationData } from './CalibrationData'
import type { BaseProtocolLabware } from '../../calibration/labware/types'
import styles from './styles.css'

export type LabwareListItemProps = {|
  ...BaseProtocolLabware,
  isDisabled: boolean,
  onClick: () => mixed,
|}

export function LabwareListItem(props: LabwareListItemProps): React.Node {
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
    parent,
    calibrationData,
    definitionHash,
  } = props
  console.log(definitionHash, 'DEF HASH IN LLI')

  const url = `/calibrate/labware/${slot}`
  const iconName = confirmed ? 'check-circle' : 'checkbox-blank-circle-outline'
  const displayName = definition ? getLabwareDisplayName(definition) : type
  let displaySlot = `Slot ${slot}`
  if (parent && getModuleType(parent) === THERMOCYCLER_MODULE_TYPE) {
    displaySlot = 'Slots 7, 8, 10, & 11'
  }
  const moduleDisplayName = parent && getModuleDisplayName(parent)

  return (
    <ListItem
      url={!isDisabled ? url : undefined}
      onClick={!isDisabled ? onClick : undefined}
      iconName={iconName}
      className={cx(styles.labware_item, { [styles.disabled]: isDisabled })}
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
            <div className={styles.slot_contents_names}>
              {parent && (
                <span className={styles.module_name}>{moduleDisplayName}</span>
              )}
              <span className={styles.labware_item_name}>
                {isTiprack ? (
                  <span className={styles.tiprack_item_mount}>
                    <span className={styles.tiprack_item_mount}>
                      {calibratorMount
                        ? calibratorMount.charAt(0).toUpperCase()
                        : ''}
                    </span>
                    {displayName}
                  </span>
                ) : (
                  displayName
                )}
              </span>
              <CalibrationData
                calibrationData={calibrationData}
                calibratedThisSession={confirmed}
                // the definitionHash will only be absent if old labware
                // or robot version <= 3.19
                calDataAvailable={definitionHash !== null}
              />
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
