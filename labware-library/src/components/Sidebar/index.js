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
  isLabwareDetail: boolean,
}

export default function Sidebar(props: SidebarProps) {
  const { filters, isLabwareDetail } = props
  console.log('sidebar: ', isLabwareDetail)
  return (
    <nav className={styles.sidebar}>
      {!isLabwareDetail && <LabwareGuide />}
      <FilterManufacturer filters={filters} isLabwareDetail={isLabwareDetail} />
      <FilterCategory filters={filters} />
    </nav>
  )
}
