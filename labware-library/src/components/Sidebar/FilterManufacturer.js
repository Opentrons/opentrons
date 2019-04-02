// @flow
// filter labware by manufacturer
import * as React from 'react'
import {withRouter} from 'react-router-dom'

import {SelectField} from '@opentrons/components'
import {getAllManufacturers, buildFiltersUrl} from '../../filters'
import styles from './styles.css'

import type {ContextRouter} from 'react-router-dom'
import type {FilterParams} from '../../types'

// TODO(mc, 2019-03-13): i18n
const EN_MANUFACTURER = 'manufacturer'

// TODO(mc, 2019-03-18): i18n
const EN_MANUFACTURER_LABELS = {
  all: 'All',
  generic: 'Generic',
}

export type FilterManufacturerProps = {
  ...ContextRouter,
  filters: FilterParams,
}

export function FilterManufacturer (props: FilterManufacturerProps) {
  const {history, filters} = props
  const manufacturers = getAllManufacturers()
  const options = manufacturers.map(value => ({
    value,
    label: EN_MANUFACTURER_LABELS[value] || value,
  }))

  return (
    <label className={styles.filter_manufacturer}>
      <p className={styles.filter_manufacturer_label}>{EN_MANUFACTURER}</p>
      <SelectField
        className={styles.filter_manufacturer_select}
        name="manufacturer"
        value={filters.manufacturer}
        options={options}
        onValueChange={(_, value) => {
          if (value) {
            history.push(buildFiltersUrl({...filters, manufacturer: value}))
          }
        }}
      />
    </label>
  )
}

export default withRouter(FilterManufacturer)
