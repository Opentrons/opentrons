// @flow
import * as React from 'react'

import { BACK_TO_LABWARE_LIBRARY } from '../../localization'
import { getPublicPath } from '../../public-path'
import { Link } from '../ui'

import styles from './styles.css'

export function Breadcrumbs() {
  return (
    <div className={styles.breadcrumbs}>
      <div className={styles.breadcrumbs_contents}>
        <span className={styles.breadcrumbs_separator}>{' < '}</span>
        <Link to={getPublicPath()} className={styles.breadcrumbs_link}>
          {BACK_TO_LABWARE_LIBRARY}
        </Link>
      </div>
    </div>
  )
}
