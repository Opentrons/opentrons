// presentational component for an item in a RobotList
import * as React from 'react'
import { NotificationIcon, Icon, ToggleButton } from '@opentrons/components'
import { useTranslation } from 'react-i18next'

import { RobotLink } from './RobotLink'
import styles from './styles.css'

export interface RobotListItemProps {
  name: string
  displayName: string
  isConnectable: boolean
  isUpgradable: boolean
  isSelected: boolean
  isLocal: boolean
  isConnected: boolean
  onToggleConnect: () => unknown
}

export function RobotListItem(props: RobotListItemProps): JSX.Element {
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
  const { t } = useTranslation('top_navigation')

  return (
    <li className={styles.robot_group}>
      <RobotLink url={`/robots/${name}`} className={styles.robot_item}>
        <NotificationIcon
          name={isLocal ? 'usb' : 'wifi'}
          className={styles.robot_item_icon}
          childName={isUpgradable ? 'circle' : null}
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
        <>
          <RobotLink
            url={`/robots/${name}/instruments`}
            className={styles.instrument_item}
          >
            <p className={styles.link_text}>{t('pipettes')}</p>
            <Icon name="chevron-right" className={styles.robot_item_icon} />
          </RobotLink>
          <RobotLink
            url={`/robots/${name}/modules`}
            className={styles.instrument_item}
          >
            <p className={styles.link_text}>{t('modules')}</p>
            <Icon name="chevron-right" className={styles.robot_item_icon} />
          </RobotLink>
        </>
      )}
    </li>
  )
}
