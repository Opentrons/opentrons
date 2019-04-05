// @flow
// filter labware by category
import * as React from 'react'
import {Link} from 'react-router-dom'
import cx from 'classnames'

import {getAllCategories, buildFiltersUrl} from '../../filters'
import styles from './styles.css'

import type {FilterParams} from '../../types'

// TODO(mc, 2019-03-18): i18n, duplicated in
//   labware-library/src/components/LabwareList/LabwareCard.js
const EN_CATEGORY_LABELS = {
  all: 'All',
  tubeRack: 'Tube Rack',
  tipRack: 'Tip Rack',
  wellPlate: 'Well Plate',
  trough: 'Trough',
  trash: 'Trash',
  other: 'Other',
}

export type FilterCategoryProps = {
  filters: FilterParams,
}

export default function FilterCategory (props: FilterCategoryProps) {
  const {filters} = props
  const categories = getAllCategories()

  return (
    <ul className={styles.filter_category}>
      {categories.map(c => (
        <li key={c} className={styles.filter_category_item}>
          <Link
            to={buildFiltersUrl({...filters, category: c})}
            className={cx(styles.filter_category_link, {
              [styles.selected]: c === filters.category,
            })}
          >
            {EN_CATEGORY_LABELS[c]}
          </Link>
        </li>
      ))}
    </ul>
  )
}
