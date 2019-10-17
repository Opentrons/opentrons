// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'

import { getFeatureFlags } from '../../config/selectors'
import { SidePanel, ListItem, Icon } from '@opentrons/components'

import styles from './styles.css'

export default function MenuPanel() {
  const featureFlags = useSelector(getFeatureFlags)

  const items = [
    { label: 'App', url: '/menu/app' },
    featureFlags.customLabware
      ? { label: 'Custom Labware', url: '/menu/custom-labware' }
      : null,
    { label: 'Resources', url: '/menu/resources' },
  ].filter(Boolean)

  return (
    <SidePanel title="Menu">
      <div className={styles.menu_panel}>
        <ol className={styles.menu_list}>
          {items.map(item => (
            <ListItem
              key={item.url}
              url={item.url}
              className={styles.menu_item}
              activeClassName={styles.active}
            >
              <span>{item.label}</span>
              <Icon name={'chevron-right'} className={styles.menu_icon} />
            </ListItem>
          ))}
        </ol>
      </div>
    </SidePanel>
  )
}
