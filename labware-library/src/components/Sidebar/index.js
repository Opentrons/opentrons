// @flow
// main application sidebar
import * as React from 'react'

import LabwareGuide from './LabwareGuide'
import FilterManufacturer from './FilterManufacturer'
import FilterCategory from './FilterCategory'
import styles from './styles.css'

export default function Sidebar () {
  return (
    <nav className={styles.sidebar}>
      <LabwareGuide />
      <FilterManufacturer />
      <FilterCategory />
    </nav>
  )
}
