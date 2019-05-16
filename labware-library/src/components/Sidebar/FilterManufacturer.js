// @flow
// filter labware by manufacturer
import * as React from 'react'
import { withRouter } from 'react-router-dom'
import cx from 'classnames'
import { SelectField } from '@opentrons/components'
import { getAllManufacturers, buildFiltersUrl } from '../../filters'
import styles from './styles.css'

import {
  MANUFACTURER,
  MANUFACTURER_LABELS_BY_MANUFACTURER,
} from '../../localization'

import type { ContextRouter } from 'react-router-dom'
import type { FilterParams } from '../../types'

export type FilterManufacturerProps = {
  ...ContextRouter,
  filters: FilterParams,
  isLabwareDetail: boolean,
}

export function FilterManufacturer(props: FilterManufacturerProps) {
  const { history, filters, isLabwareDetail } = props
  const manufacturers = getAllManufacturers()
  const options = manufacturers.map(value => ({
    value,
    label: MANUFACTURER_LABELS_BY_MANUFACTURER[value] || value,
  }))

  console.log(isLabwareDetail)
  const className = isLabwareDetail
    ? cx(styles.filter_manufacturer, styles.xl_filter_manufacturer)
    : styles.filter_manufacturer

  return (
    <label className={className}>
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
