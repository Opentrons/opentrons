// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'

import { getPublicPath } from '../../public-path'
import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

// TODO(mc, 2019-04-07): i18n
const EN_LABWARE_LIBRARY = 'Labware Library'

export type BreadcrumbsProps = {
  definition: LabwareDefinition | null,
}

export default function Breadcrumbs(props: BreadcrumbsProps) {
  const { definition } = props
  if (!definition) return null

  return (
    <div className={styles.breadcrumbs}>
      <div className={styles.breadcrumbs_contents}>
        <Link to={getPublicPath()} className={styles.breadcrumbs_link}>
          {EN_LABWARE_LIBRARY}
        </Link>
        <span className={styles.breadcrumbs_separator}>{' > '}</span>
        <Link
          to={`${getPublicPath()}${definition.parameters.loadName}`}
          className={styles.breadcrumbs_link}
        >
          {definition.metadata.displayName}
        </Link>
      </div>
    </div>
  )
}
