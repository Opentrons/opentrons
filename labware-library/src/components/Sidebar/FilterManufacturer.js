// @flow
// filter labware by manufacturer
import * as React from 'react'
import { withRouter } from 'react-router-dom'
import { SelectField } from '@opentrons/components'
import { getAllManufacturers, buildFiltersUrl } from '../../filters'
import styles from './styles.css'

import {
  MANUFACTURER,
  MANUFACTURER_LABELS_BY_MANUFACTURER,
} from '../../localization'

import type { ContextRouter } from 'react-router-dom'
import type { FilterParams } from '../../types'

export type FilterManufacturerProps = {|
  ...ContextRouter,
  filters: FilterParams,
|}

export function FilterManufacturer(props: FilterManufacturerProps) {
  const { history, filters } = props
  const manufacturers = getAllManufacturers()
  const options = manufacturers.map(value => ({
    value,
    label: MANUFACTURER_LABELS_BY_MANUFACTURER[value] || value,
  }))

  return (
    <label className={styles.filter_manufacturer}>
      <p className={styles.filter_manufacturer_label}>{MANUFACTURER}</p>
      <SelectField
        className={styles.filter_manufacturer_select}
        name="manufacturer"
        value={filters.manufacturer}
        options={options}
        onValueChange={(_, value) => {
          if (value) {
            history.push(buildFiltersUrl({ ...filters, manufacturer: value }))
          }
        }}
      />
    </label>
  )
}

export default withRouter(FilterManufacturer)
