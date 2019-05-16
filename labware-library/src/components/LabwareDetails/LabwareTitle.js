// @flow
// labware details page title and category
import * as React from 'react'

import { LabelText, Value, LABEL_LEFT } from '../ui'

import { CATEGORY, CATEGORY_LABELS_BY_CATEGORY } from '../../localization'

import styles from './styles.css'

import type { LabwareDefinition } from '../../types'

export type LabwareTitleProps = {
  definition: LabwareDefinition,
}

export default function LabwareTitle(props: LabwareTitleProps) {
  const { definition } = props
  const { metadata } = definition
  const { displayCategory } = definition.metadata
  const categoryProps = {
    label: CATEGORY,
    value:
      CATEGORY_LABELS_BY_CATEGORY[displayCategory] ||
      CATEGORY_LABELS_BY_CATEGORY.other,
  }

  return (
    <>
      <div className={styles.category_container}>
        <LabelText position={LABEL_LEFT}>{categoryProps.label}</LabelText>
        <Value>{categoryProps.value}</Value>
      </div>
      <h2 className={styles.title}>{metadata.displayName}</h2>
    </>
  )
}
