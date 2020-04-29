// @flow
import * as React from 'react'
import { SidePanel, ListItem, Icon } from '@opentrons/components'

import styles from './styles.css'

// TODO(mc, 2019-12-03): i18n
const MENU = 'Menu'
const ITEMS = [
  { label: 'App', url: '/menu/app' },
  { label: 'Custom Labware', url: '/menu/custom-labware' },
  { label: 'Network & System', url: '/menu/network-and-system' },
  { label: 'Resources', url: '/menu/resources' },
]

export function MenuPanel() {
  return (
    <SidePanel title={MENU}>
      <div className={styles.menu_panel}>
        <ol className={styles.menu_list}>
          {ITEMS.map(item => (
            <ListItem
              key={item.url}
              url={item.url}
              className={styles.menu_item}
              activeClassName={styles.active}
            >
              <span>{item.label}</span>
              <Icon name="chevron-right" className={styles.menu_icon} />
            </ListItem>
          ))}
        </ol>
      </div>
    </SidePanel>
  )
}
