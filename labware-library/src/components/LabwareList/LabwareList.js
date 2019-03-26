// @flow
// main LabwareList component
import * as React from 'react'

import styles from './styles.css'

import {getAllDefinitions} from '../../definitions'
import LabwareCard from './LabwareCard'

export default function LabwareList () {
  return (
    <ul className={styles.list}>
      {getAllDefinitions().map(d => (
        <LabwareCard key={d.otId} definition={d} />
      ))}
    </ul>
  )
}
