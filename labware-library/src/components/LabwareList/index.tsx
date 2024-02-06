// main LabwareList component
import * as React from 'react'
import { getLabwareDefURI } from '@opentrons/shared-data'
import { getFilteredDefinitions } from '../../filters'
import { LabwareCard } from './LabwareCard'
import { CustomLabwareCard } from './CustomLabwareCard'
import styles from './styles.module.css'
import type { FilterParams } from '../../types'

export interface LabwareListProps {
  filters: FilterParams
}

export function LabwareList(props: LabwareListProps): JSX.Element {
  const definitions = getFilteredDefinitions(props.filters)

  return (
    <ul className={styles.list}>
      {definitions.map(d => (
        <LabwareCard key={getLabwareDefURI(d)} definition={d} />
      ))}

      <CustomLabwareCard isResultsEmpty={definitions.length === 0} />
    </ul>
  )
}
