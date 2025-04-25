// labware details page title and category
import { getLabwareDisplayName } from '@opentrons/shared-data'

import { CATEGORY, CATEGORY_LABELS_BY_CATEGORY } from '../../localization'
import { LABEL_LEFT, LabelText, Value } from '../ui'
import styles from './styles.module.css'

import type { LabwareDefinition } from '../../types'

export interface LabwareTitleProps {
  definition: LabwareDefinition
  className?: string
}

export function LabwareTitle(props: LabwareTitleProps): JSX.Element {
  const { definition, className } = props
  const displayName = getLabwareDisplayName(definition)
  const category =
    CATEGORY_LABELS_BY_CATEGORY[definition.metadata.displayCategory] ||
    CATEGORY_LABELS_BY_CATEGORY.other

  return (
    <div className={className}>
      <div className={styles.category_container}>
        <LabelText position={LABEL_LEFT}>{CATEGORY}</LabelText>
        <Value>{category}</Value>
      </div>
      <h2 className={styles.title}>{displayName}</h2>
    </div>
  )
}
