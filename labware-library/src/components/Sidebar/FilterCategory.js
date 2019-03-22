// @flow
// filter labware by category
import * as React from 'react'

import styles from './styles.css'

// TODO(mc, 2019-03-13): do not hardcode categories; pull from imports
const CATEGORIES = [
  {label: 'All', value: 'all'},
  {label: 'Tip Rack', value: 'tiprack'},
  {label: 'Tube Rack', value: 'tuberack'},
  {label: 'Trough', value: 'trough'},
  {label: 'Trash', value: 'trash'},
  {label: 'Well Plate', value: 'wellPlate'},
]

export default function FilterCategory () {
  return (
    <ul className={styles.filter_category}>
      {CATEGORIES.map(c => (
        <li key={c.value} className={styles.filter_category_item}>
          {c.label}
        </li>
      ))}
    </ul>
  )
}
