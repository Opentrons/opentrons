// @flow
import * as React from 'react'
import startCase from 'lodash/startCase'
import { format } from 'date-fns'

import styles from './styles.css'

export type LabwareItemProps = {|
  name: string,
  version: number,
  displayName: string,
  displayCategory: string,
  dateAdded: number,
|}

export default function LabwareItem(props: LabwareItemProps) {
  const { name, version, displayName, displayCategory, dateAdded } = props

  return (
    <li className={styles.item}>
      <div className={styles.item_category_column}>
        <p>{startCase(displayCategory)}</p>
        <p>{`v${version}`}</p>
      </div>
      <div className={styles.item_name_column}>
        <p className={styles.item_display_name}>{displayName}</p>
        <p className={styles.item_load_name}>{name}</p>
      </div>
      <p className={styles.item_date_column}>
        {format(new Date(dateAdded), 'yyyy-MM-dd')}
      </p>
    </li>
  )
}
