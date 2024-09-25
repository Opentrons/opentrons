// filter labware by manufacturer
import { useNavigate } from 'react-router-dom'
import { SelectField } from '@opentrons/components'
import { getAllManufacturers, buildFiltersUrl } from '../../filters'
import styles from './styles.module.css'

import { MANUFACTURER, MANUFACTURER_VALUES } from '../../localization'

import type { SelectOptionOrGroup } from '@opentrons/components'
import type { FilterParams } from '../../types'

export interface FilterManufacturerProps {
  filters: FilterParams
}

export function FilterManufacturer(
  props: FilterManufacturerProps
): JSX.Element {
  const { filters } = props
  const navigate = useNavigate()
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
            navigate(buildFiltersUrl({ ...filters, manufacturer: value }))
          }
        }}
      />
    </label>
  )
}
