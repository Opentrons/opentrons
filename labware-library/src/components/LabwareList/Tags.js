// @flow

import * as React from 'react'

import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

// TODO(mc, 2019-04-08): i18n
const EN_TAGS = 'tags'

export type TagsProps = {
  definition: LabwareDefinition,
}

export default function Tags(props: TagsProps) {
  const tags = props.definition.metadata.tags || []

  return (
    <div className={styles.tags}>
      <p className={styles.left_label}>{EN_TAGS}</p>
      <p className={styles.value}>{tags.join(', ')}</p>
    </div>
  )
}
