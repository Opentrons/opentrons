// @flow
import * as React from 'react'

import {SidePanel, ListItem, Icon} from '@opentrons/components'

import styles from './styles.css'

export default function MenuPanel () {
  return (
    <SidePanel title='Menu'>
      <div className={styles.menu_panel}>
        <ol>
          <ListItem className={styles.menu_item} url={'/menu/app'} activeClassName={styles.active}>
            <span>App</span>
            <Icon name={'chevron-right'} className={styles.menu_icon}/>
          </ListItem>
        </ol>
      </div>
    </SidePanel>
  )
}
