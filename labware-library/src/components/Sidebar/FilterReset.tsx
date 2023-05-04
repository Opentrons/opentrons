// reset all filters button
import { buildFiltersUrl, FILTER_OFF } from '../../filters'
import { CLEAR_FILTERS } from '../../localization'
import type { FilterParams } from '../../types'
import styles from './styles.css'
import { Icon } from '@opentrons/components'
import * as React from 'react'
import { Link } from 'react-router-dom'

export interface FilterResetProps {
  filters: FilterParams
}

export function FilterReset(props: FilterResetProps): JSX.Element | null {
  const { filters } = props
  // TODO (ka 2019-3-09):Should this be moved to Sidebar?
  const { manufacturer, category } = filters
  const filtersCleared = manufacturer === FILTER_OFF && category === FILTER_OFF
  if (filtersCleared) return null

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
