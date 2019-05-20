// @flow
// main application sidebar
import * as React from 'react'
import LabwareGuide from './LabwareGuide'
import FilterManufacturer from './FilterManufacturer'
import FilterCategory from './FilterCategory'
import styles from './styles.css'

import type { FilterParams } from '../../types'

export type SidebarProps = {
  filters: FilterParams,
}

export default function Sidebar(props: SidebarProps) {
  const { filters } = props
  return (
    <nav className={styles.sidebar}>
      <LabwareGuide />
      <FilterManufacturer filters={filters} />
      <FilterCategory filters={filters} />
    </nav>
  )
}
