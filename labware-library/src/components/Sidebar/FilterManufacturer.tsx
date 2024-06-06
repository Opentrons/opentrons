// filter labware by manufacturer
import * as React from 'react'
import { withRouter } from 'react-router-dom'
import { SelectField } from '@opentrons/components'
import { getAllManufacturers, buildFiltersUrl } from '../../filters'
import styles from './styles.module.css'

import { MANUFACTURER, MANUFACTURER_VALUES } from '../../localization'

import type { SelectOptionOrGroup } from '@opentrons/components'
import type { RouteComponentProps } from 'react-router-dom'
import type { FilterParams } from '../../types'

export interface FilterManufacturerProps extends RouteComponentProps {
  filters: FilterParams
}

export function FilterManufacturerComponent(
  props: FilterManufacturerProps
): JSX.Element {
  const { history, filters } = props
  const manufacturers = getAllManufacturers()
  const options: SelectOptionOrGroup[] = manufacturers.map(value => ({
    value,
    label: MANUFACTURER_VALUES[value] || value,
  }))

  options.push({ options: [{ label: 'Other', value: 'other' }] })

  return (
    <label className={styles.filter_manufacturer}>
      <p className={styles.filter_label}>{MANUFACTURER}</p>
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
// @ts-expect-error react router type not portable
export const FilterManufacturer: (props: {
  filters: FilterParams
}) => JSX.Element = withRouter(FilterManufacturerComponent)
