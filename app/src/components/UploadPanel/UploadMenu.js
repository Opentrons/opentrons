import * as React from 'react'
import {ListItem, Icon} from '@opentrons/components'
import styles from './upload-panel.css'
export default function UploadMenu () {
  return (
    <ol className={styles.menu_list}>
      <ListItem className={styles.menu_item} url={'/upload/file-info'} activeClassName={styles.active}>
        <span>File Overview</span>
        <Icon name={'chevron-right'} className={styles.menu_icon}/>
      </ListItem>
    </ol>
  )
}
