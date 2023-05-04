// filter labware by manufacturer
import { getAllManufacturers, buildFiltersUrl } from '../../filters'
import { MANUFACTURER, MANUFACTURER_VALUES } from '../../localization'
import type { FilterParams } from '../../types'
import styles from './styles.css'
import { SelectField } from '@opentrons/components'
import type { SelectOptionOrGroup } from '@opentrons/components'
import * as React from 'react'
import { withRouter } from 'react-router-dom'
import type { RouteComponentProps } from 'react-router-dom'

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

export const FilterManufacturer = withRouter(FilterManufacturerComponent)
