// @flow
// labware details page title and category
import * as React from 'react'

import { LabelText, Value, LABEL_LEFT } from '../ui'

import { CATEGORY, CATEGORY_LABELS_BY_CATEGORY } from '../../localization'

import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

export type LabwareTitleProps = {|
  definition: LabwareDefinition,
  className?: string,
|}

export function LabwareTitle(props: LabwareTitleProps): React.Node {
  const { definition, className } = props
  const { metadata } = definition
  const { displayCategory } = definition.metadata
  const category =
    CATEGORY_LABELS_BY_CATEGORY[displayCategory] ||
    CATEGORY_LABELS_BY_CATEGORY.other

  return (
    <div className={className}>
      <div className={styles.category_container}>
        <LabelText position={LABEL_LEFT}>{CATEGORY}</LabelText>
        <Value>{category}</Value>
      </div>
      <h2 className={styles.title}>{metadata.displayName}</h2>
    </div>
  )
}
