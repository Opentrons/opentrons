// @flow
import * as React from 'react'
import { Card } from '@opentrons/components'

import styles from './styles.css'

// TODO(mc, 2019-10-22): i18n
const LIST_LABWARE_CARD_TITLE = 'Custom Labware Listing'
const NAME = 'Name'
const DATE_ADDED = 'Date Added'

export type ListCardProps = {|
  children?: React.Node,
|}

export default function ListCard(props: ListCardProps) {
  return (
    <Card title={LIST_LABWARE_CARD_TITLE} className={styles.card}>
      <div className={styles.list_column_titles}>
        <p className={styles.item_category_column} />
        <p className={styles.item_name_column}>{NAME}</p>
        <p className={styles.item_date_column}>{DATE_ADDED}</p>
      </div>
      <ul>{props.children}</ul>
    </Card>
  )
}
