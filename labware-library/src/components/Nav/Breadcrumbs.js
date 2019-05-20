// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'

import { BACK_TO_LABWARE_LIBRARY } from '../../localization'
import { getPublicPath } from '../../public-path'
import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

export type BreadcrumbsProps = {
  definition: LabwareDefinition | null,
}

export default function Breadcrumbs(props: BreadcrumbsProps) {
  const { definition } = props
  if (!definition) return null

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
