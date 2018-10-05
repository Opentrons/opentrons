// @flow
// list of robots
import * as React from 'react'
import {NotificationIcon, Icon, HoverTooltip} from '@opentrons/components'

import type {Robot} from '../../robot'
import {ToggleButton} from '../controls'
import RobotLink from './RobotLink'
import styles from './connect-panel.css'

type ItemProps = Robot & {
  upgradable: ?string,
  selected: boolean,
  connect: () => mixed,
  disconnect: () => mixed,
}

export function RobotListItem (props: ItemProps) {
  const {
    name,
    wired,
    selected,
    isConnected,
    upgradable,
    connect,
    disconnect,
  } = props
  const onClick = isConnected ? disconnect : connect

  return (
    <li className={styles.robot_group}>
      <HoverTooltip
        tooltipComponent={<div>Unable to locate this robot</div>}
        placement="bottom"
      >
        {hoverTooltipHandlers => (
          <RobotLink
            url={`/robots/${name}`}
            className={styles.robot_item}
            exact
            hoverTooltipHandlers={hoverTooltipHandlers}
          >
            <NotificationIcon
              name={wired ? 'usb' : 'wifi'}
              className={styles.robot_item_icon}
              childName={upgradable ? 'circle' : null}
              childClassName={styles.notification}
            />

            <p className={styles.link_text}>{name}</p>

            <ToggleButton
              toggledOn={isConnected}
              onClick={onClick}
              className={styles.robot_item_icon}
            />
          </RobotLink>
        )}
      </HoverTooltip>
      {selected && (
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

export function ConnectableRobot (props: ItemProps) {
  return (
    <React.Fragment>
      <RobotLink url={`/robots/${name}`} className={styles.robot_item} exact>
        <NotificationIcon
          name={props.wired ? 'usb' : 'wifi'}
          className={styles.robot_item_icon}
          childName={props.upgradable ? 'circle' : null}
          childClassName={styles.notification}
        />

        <p className={styles.link_text}>{name}</p>

        <ToggleButton
          toggledOn={props.isConnected}
          onClick={props.onClick}
          className={styles.robot_item_icon}
        />
      </RobotLink>
      {props.selected && (
        <RobotLink
          url={`/robots/${name}/instruments`}
          className={styles.instrument_item}
        >
          <p className={styles.link_text}>Pipettes & Modules</p>
          <Icon name="chevron-right" className={styles.robot_item_icon} />
        </RobotLink>
      )}
    </React.Fragment>
  )
}

export function ReachableRobot (props: ItemProps) {
  return (
    <RobotLink url={`/robots/${name}`} className={styles.robot_item} exact>
      <Icon
        name={props.wired ? 'usb' : 'wifi'}
        className={styles.robot_item_icon}
      />

      <p className={styles.link_text}>{name}</p>

      <Icon name="chevron-right" className={styles.robot_item_icon} />
    </RobotLink>
  )
}

export function UnreachableRobot (props: ItemProps) {
  return (
    <RobotLink
      url={`/robots/${name}`}
      className={styles.robot_item}
      exact
      disabled
    >
      <Icon name={'alert'} className={styles.robot_item_icon} disabled />
      <p className={styles.link_text}>{name}</p>
    </RobotLink>
  )
}
