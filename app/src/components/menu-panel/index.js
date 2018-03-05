// @flow
import * as React from 'react'

import {ListItem, Icon, CHEVRON_RIGHT} from '@opentrons/components'

import styles from './styles.css'

export default function MenuPanel () {
  return (
    <div className={styles.menu_panel}>
      <ol>
        <ListItem className={styles.menu_item} url={'/menu/app'} activeClassName={styles.active}>
          <span>App</span>
          <Icon name={CHEVRON_RIGHT} className={styles.menu_icon}/>
        </ListItem>
      </ol>
    </div>
  )
}
