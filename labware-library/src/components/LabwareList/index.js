// @flow
// main LabwareList component
import * as React from 'react'

import { getFilteredDefinitions } from '../../filters'
import LabwareCard from './LabwareCard'
import NoResults from './NoResults'
import styles from './styles.css'

import type { FilterParams } from '../../types'

export type LabwareListProps = {|
  filters: FilterParams,
|}

export { default as NoResults } from './NoResults'

export default function LabwareList(props: LabwareListProps) {
  const definitions = getFilteredDefinitions(props.filters)

  return definitions.length === 0 ? (
    <NoResults />
  ) : (
    <ul className={styles.list}>
      {definitions.map(d => (
        <LabwareCard key={d.otId} definition={d} />
      ))}
    </ul>
  )
}
