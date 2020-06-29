// @flow
// main LabwareList component
import { getLabwareDefURI } from '@opentrons/shared-data'
import * as React from 'react'

import { getFilteredDefinitions } from '../../filters'
import type { FilterParams } from '../../types'
import { LabwareCard } from './LabwareCard'
import { NoResults } from './NoResults'
import styles from './styles.css'

export type LabwareListProps = {|
  filters: FilterParams,
|}

export { NoResults } from './NoResults'

export function LabwareList(props: LabwareListProps): React.Node {
  const definitions = getFilteredDefinitions(props.filters)

  return definitions.length === 0 ? (
    <NoResults />
  ) : (
    <ul className={styles.list}>
      {definitions.map(d => (
        <LabwareCard key={getLabwareDefURI(d)} definition={d} />
      ))}
    </ul>
  )
}
