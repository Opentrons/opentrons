// main LabwareList component
import { getFilteredDefinitions } from '../../filters'
import type { FilterParams } from '../../types'
import { CustomLabwareCard } from './CustomLabwareCard'
import { LabwareCard } from './LabwareCard'
import styles from './styles.css'
import { getLabwareDefURI } from '@opentrons/shared-data'
import * as React from 'react'

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
