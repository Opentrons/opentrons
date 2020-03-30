// @flow
// presentational component for an item in a RobotList
import * as React from 'react'
import { NotificationIcon, Icon, ToggleButton } from '@opentrons/components'

import { RobotLink } from './RobotLink'
import styles from './styles.css'

export type RobotListItemProps = {|
  name: string,
  displayName: string,
  isConnectable: boolean,
  isUpgradable: boolean,
  isSelected: boolean,
  isLocal: boolean,
  isConnected: boolean,
  onToggleConnect: () => mixed,
|}

export function RobotListItem(props: RobotListItemProps) {
  const {
    name,
    displayName,
    isConnectable,
    isUpgradable,
    isSelected,
    isLocal,
    isConnected,
    onToggleConnect,
  } = props

  return (
    <li className={styles.robot_group}>
      <RobotLink url={`/robots/${name}`} className={styles.robot_item}>
        <NotificationIcon
          name={isLocal ? 'usb' : 'wifi'}
          className={styles.robot_item_icon}
          childName={isUpgradable ? 'circle' : null}
          childClassName={styles.notification}
        />
        <p className={styles.link_text}>{displayName}</p>
        {isConnectable ? (
          <ToggleButton
            toggledOn={isConnected}
            onClick={onToggleConnect}
            className={styles.robot_item_icon}
          />
        ) : (
          <Icon name="chevron-right" className={styles.robot_item_icon} />
        )}
      </RobotLink>
      {isConnectable && isSelected && (
        <RobotLink
          url={`/robots/${name}/instruments`}
          className={styles.instrument_item}
        >
          <p className={styles.link_text}>Pipettes & Modules</p>
          <Icon name="chevron-right" className={styles.robot_item_icon} />
        </RobotLink>
      )}
    </li>
  )
}
