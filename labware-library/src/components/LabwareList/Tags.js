// @flow

import * as React from 'react'

import { LabelText, Value, LABEL_LEFT } from '../ui'
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
      <LabelText position={LABEL_LEFT}>{EN_TAGS}</LabelText>
      <Value>{tags.join(', ')}</Value>
    </div>
  )
}
