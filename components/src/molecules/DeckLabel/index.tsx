import clsx from 'clsx'

import { getModuleType } from '@opentrons/shared-data'

import { StyledText } from '../../atoms'
import { ModuleIcon } from '../../icons'
import { FLEX_MAX_CONTENT } from '../../styles'
import styles from './decklabel.module.css'

import type { ReactNode } from 'react'
import type { ModuleModel } from '@opentrons/shared-data'

export interface DeckLabelProps {
  /** Visible label text. */
  text: string
  /** Applies selected-state styling. */
  isSelected: boolean
  /** Renders compact styling and icon sizing for zoomed deck view. */
  isZoomed: boolean
  /** Optional module model used to render a module icon in zoomed view. */
  moduleModel?: ModuleModel
  /** Optional maximum width constraint for the label container. */
  maxWidth?: string
  /** Whether this label is the last item in a grouped sequence. */
  isLast?: boolean
}

export function DeckLabel({
  text,
  isSelected,
  isZoomed,
  moduleModel,
  maxWidth = FLEX_MAX_CONTENT,
}: DeckLabelProps): ReactNode {
  return (
    <div
      data-testid={`DeckLabel_${isSelected ? 'Selected' : 'UnSelected'}`}
      className={clsx(
        styles.deck_label,
        isZoomed ? styles.deck_label_zoomed : styles.deck_label_unzoomed,
        {
          [styles.deck_label_selected]: isSelected,
          [styles.deck_label_unselected]: !isSelected,
        }
      )}
      style={{ maxWidth }}
    >
      {moduleModel != null && isZoomed ? (
        <ModuleIcon size="0.5rem" moduleType={getModuleType(moduleModel)} />
      ) : null}
      <StyledText className={styles.deck_label_text}>{text}</StyledText>
    </div>
  )
}
