// @flow
// reset all filters button
import * as React from 'react'
import { Link } from 'react-router-dom'
import cx from 'classnames'

import { buildFiltersUrl } from '../../filters'
import { Icon } from '@opentrons/components'
import styles from './styles.css'

import { CLEAR_FILTERS } from '../../localization'

import type { FilterParams } from '../../types'

export type FilterCategoryProps = {|
  filters: FilterParams,
|}

export default function FilterCategory(props: FilterCategoryProps) {
  const { filters } = props

  return (
    <Link
      to={buildFiltersUrl({ ...filters, category: 'all', manufacturer: 'all' })}
      className={styles.filter_reset_link}
    >
      <Icon name="close" className={styles.filter_reset_icon} />
      {CLEAR_FILTERS}
    </Link>
  )
}
