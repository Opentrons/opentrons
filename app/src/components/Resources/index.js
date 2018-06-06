// @flow
// resources page layout
import * as React from 'react'

import KnowledgeCard from './KnowledgeCard'
import LibraryCard from './LibraryCard'

import styles from './styles.css'

export default function Resources () {
  return (
    <div className={styles.resources_page}>
      <div className={styles.row}>
        <KnowledgeCard />
      </div>
      <div className={styles.row}>
        <LibraryCard />
      </div>
    </div>
  )
}
