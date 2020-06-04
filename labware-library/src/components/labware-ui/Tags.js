// @flow

import * as React from 'react'

import { LabelText, Value, LABEL_LEFT } from '../ui'
import { TAGS } from '../../localization'
import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

export type TagsProps = {|
  definition: LabwareDefinition,
  className?: string,
|}

export function Tags(props: TagsProps): React.Node {
  const { definition, className } = props
  const tags = definition.metadata.tags || []

  // if (tags.length === 0) return null

  return (
    <div className={className}>
      {Boolean(tags.length) && (
        <div className={styles.tags_data}>
          <LabelText position={LABEL_LEFT}>{TAGS}</LabelText>
          <Value>{tags.join(', ')}</Value>
        </div>
      )}
    </div>
  )
}
