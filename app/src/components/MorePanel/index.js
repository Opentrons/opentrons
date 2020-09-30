// @flow
import * as React from 'react'
import { SidePanel, ListItem, Icon } from '@opentrons/components'

import { MORE } from '../../nav'
import styles from './styles.css'

// TODO(mc, 2019-12-03): i18n
const ITEMS = [
  { label: 'App', url: '/more/app' },
  { label: 'Custom Labware', url: '/more/custom-labware' },
  { label: 'Network & System', url: '/more/network-and-system' },
  { label: 'Resources', url: '/more/resources' },
]

export function MorePanel(): React.Node {
  return (
    <SidePanel title={MORE}>
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
