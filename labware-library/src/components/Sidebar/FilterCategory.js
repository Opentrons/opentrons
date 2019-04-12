// @flow
// filter labware by category
import * as React from 'react'
import { Link } from 'react-router-dom'
import cx from 'classnames'

import { getAllCategories, buildFiltersUrl } from '../../filters'
import styles from './styles.css'

import { CATEGORY_LABELS_BY_CATEGORY } from '../../localization'

import type { FilterParams } from '../../types'

export type FilterCategoryProps = {
  filters: FilterParams,
}

export default function FilterCategory(props: FilterCategoryProps) {
  const { filters } = props
  const categories = getAllCategories()

  return (
    <ul className={styles.filter_category}>
      {categories.map(c => (
        <li key={c} className={styles.filter_category_item}>
          <Link
            to={buildFiltersUrl({ ...filters, category: c })}
            className={cx(styles.filter_category_link, {
              [styles.selected]: c === filters.category,
            })}
          >
            {CATEGORY_LABELS_BY_CATEGORY[c]}
          </Link>
        </li>
      ))}
    </ul>
  )
}
