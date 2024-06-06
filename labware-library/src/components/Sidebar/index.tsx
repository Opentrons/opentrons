// main application sidebar
import * as React from 'react'
import { LabwareGuide } from './LabwareGuide'
import { FilterManufacturer } from './FilterManufacturer'
import { FilterCategory } from './FilterCategory'
import { FilterReset } from './FilterReset'
import styles from './styles.module.css'

import type { FilterParams } from '../../types'

export interface SidebarProps {
  filters: FilterParams
}

export function Sidebar(props: SidebarProps): JSX.Element {
  const { filters } = props

  return (
    <nav className={styles.sidebar}>
      <LabwareGuide />
      <FilterManufacturer filters={filters} />
      <FilterCategory filters={filters} />
      <FilterReset filters={filters} />
    </nav>
  )
}
