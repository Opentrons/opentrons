// well dimensions and spacing for details page
import round from 'lodash/round'

import { getSpacingDiagram } from '@opentrons/components'

import {
  MM,
  NA,
  SPACING,
  VARIOUS,
  X_OFFSET,
  X_SPACING,
  Y_OFFSET,
  Y_SPACING,
} from '../../localization'
import { LabeledValueTable, LowercaseText } from '../ui'
import styles from './styles.module.css'

import type { LabwareWellGroupProperties } from '../../types'

// safe toFixed
const toFixed = (n: number): string => round(n, 2).toFixed(2)

const spacingValue = (spacing: number | null): JSX.Element | string => {
  if (!spacing) {
    return (
      <span className={styles.lighter}>{spacing === null ? VARIOUS : NA}</span>
    )
  }

  return toFixed(spacing)
}

export interface WellSpacingProps {
  category?: string
  isMultiRow?: boolean
  wellProperties: LabwareWellGroupProperties
  labelSuffix?: string
  className?: string
}

export function WellSpacing(props: WellSpacingProps): JSX.Element {
  const { labelSuffix, wellProperties, className, category, isMultiRow } = props
  const spacing = [
    { label: X_OFFSET, value: toFixed(wellProperties.xOffsetFromLeft) },
    { label: Y_OFFSET, value: toFixed(wellProperties.yOffsetFromBack) },
    { label: X_SPACING, value: spacingValue(wellProperties.xSpacing) },
    { label: Y_SPACING, value: spacingValue(wellProperties.ySpacing) },
  ]
  const shape = wellProperties.shape?.shape

  const diagram = getSpacingDiagram({
    category: category,
    guideType: 'spacing',
    shape: shape,
    isMultiRow: isMultiRow,
  }).map<JSX.Element>((src, index) => <img src={src} key={index} />)

  return (
    <LabeledValueTable
      className={className}
      label={
        <>
          {SPACING} <LowercaseText>({MM})</LowercaseText> {labelSuffix || ''}
        </>
      }
      values={spacing}
      diagram={diagram}
    />
  )
}
