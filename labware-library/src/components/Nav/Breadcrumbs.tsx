import * as React from 'react'

import { BACK_TO_LABWARE_LIBRARY } from '../../localization'
import { getPublicPath } from '../../public-path'
import { Link } from '../ui'

import styles from './styles.css'

interface BreadcrumbsProps {
  show?: boolean
}
export function Breadcrumbs(props: BreadcrumbsProps): JSX.Element {
  const { show = true } = props
  return (
    <div
      className={styles.breadcrumbs}
      style={{ display: show ? 'block' : 'none' }}
    >
      <div className={styles.breadcrumbs_contents}>
        <span className={styles.breadcrumbs_separator}>{' < '}</span>
        <Link to={getPublicPath()} className={styles.breadcrumbs_link}>
          {BACK_TO_LABWARE_LIBRARY}
        </Link>
      </div>
    </div>
  )
}
