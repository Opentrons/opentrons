// @flow
// main application wrapper component
import * as React from 'react'
import {hot} from 'react-hot-loader/root'

import Nav from '../Nav'
import Sidebar from '../Sidebar'
import LabwareList from '../LabwareList'
import styles from './styles.css'

export function App () {
  return (
    <div className={styles.app}>
      <Nav />
      <div className={styles.page_scroller}>
        <div className={styles.page}>
          <Sidebar />
          <section className={styles.content}>
            <div className={styles.content_container}>
              <LabwareList />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default hot(App)
