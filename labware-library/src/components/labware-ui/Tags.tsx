import { TAGS } from '../../localization'
import { LABEL_LEFT, LabelText, Value } from '../ui'
import styles from './styles.module.css'

import type { LabwareDefinition } from '../../types'

export interface TagsProps {
  definition: LabwareDefinition
  className?: string
}

export function Tags(props: TagsProps): JSX.Element {
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
