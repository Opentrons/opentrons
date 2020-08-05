// @flow
import * as React from 'react'
import cx from 'classnames'
import isEqual from 'lodash/isEqual'

import {
  getLabwareDisplayName,
  getModuleDisplayName,
  getModuleType,
  THERMOCYCLER_MODULE_TYPE,
  type ModuleModel,
} from '@opentrons/shared-data'
import {
  ListItem,
  HoverTooltip,
  Flex,
  Text,
  DIRECTION_COLUMN,
  SPACING_2,
} from '@opentrons/components'
import { CalibrationValues } from '../CalibrateLabware/CalibrationValues'
import type {
  BaseProtocolLabware,
  LabwareCalibrationData,
} from '../../calibration/labware/types'
import styles from './styles.css'

// TODO(bc, 2020-08-03): i18n
const NOT_CALIBRATED = 'Not yet calibrated'
const UPDATED_DATA = 'Updated data'
const EXISTING_DATA = 'Existing data'

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
  } = props

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

export function CalibrationData(props: {|
  calibrationData: LabwareCalibrationData | null,
  calibratedThisSession: boolean,
|}): React.Node {
  const { calibrationData, calibratedThisSession } = props
  if (calibrationData === null && !calibratedThisSession) {
    return (
      <Text as="i" marginTop={SPACING_2}>
        {NOT_CALIBRATED}
      </Text>
    )
  } else if (calibrationData) {
    return (
      <Flex flexDirection={DIRECTION_COLUMN} marginTop={SPACING_2}>
        {calibratedThisSession ? UPDATED_DATA : EXISTING_DATA}
        :
        <CalibrationValues {...calibrationData} />
      </Flex>
    )
  } else {
    // NOTE: this case should never be reached as calibrationData will never be null
    // at the same time that calibratedThisSession is truthy
    return null
  }
}
