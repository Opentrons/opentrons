// @flow
import * as React from 'react'

import {getFilters} from '../../filters'
import Sidebar from '../Sidebar'
import LabwareList from '../LabwareList'
import styles from './styles.css'

import type {Location} from 'react-router-dom'

export type PageProps = {
  location: Location,
}

export default function Page (props: PageProps) {
  const filters = getFilters(props.location)

  return (
    <div className={styles.page_scroller}>
      <div className={styles.page}>
        <Sidebar filters={filters} />
        <section className={styles.content}>
          <div className={styles.content_container}>
            <LabwareList filters={filters} />
          </div>
        </section>
      </div>
    </div>
  )
}
