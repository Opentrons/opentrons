// @flow
// top nav bar component
import * as React from 'react'

import { MainNav, SubdomainNav } from '../website-navigation'
import styles from './styles.css'

export { Breadcrumbs } from './Breadcrumbs'

export function Nav(): React.Node {
  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.subdomain_nav_wrapper}>
          <div className={styles.nav_container}>
            <SubdomainNav />
          </div>
        </div>
        <div className={styles.main_nav_wrapper}>
          <div className={styles.nav_container}>
            <MainNav />
          </div>
        </div>
      </nav>
    </>
  )
}
