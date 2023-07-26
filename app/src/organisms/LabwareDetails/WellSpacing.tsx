import * as React from 'react'
import { useTranslation } from 'react-i18next'
import round from 'lodash/round'
import { getSpacingDiagram } from '@opentrons/components'
import { LabeledValue } from './StyledComponents/LabeledValue'
import { ExpandingTitle } from './StyledComponents/ExpandingTitle'

import type { LabwareWellGroupProperties } from '../../pages/Labware/types'

const toFixed = (n: number): string => round(n, 2).toFixed(2)

export interface WellSpacingProps {
  category?: string
  isMultiRow?: boolean
  wellProperties: LabwareWellGroupProperties
  labelSuffix?: string
  className?: string
}

export function WellSpacing(props: WellSpacingProps): JSX.Element {
  const { t } = useTranslation('labware_details')
  const { labelSuffix, wellProperties, category, isMultiRow } = props

  const spacing = [
    { label: t('x_offset'), value: toFixed(wellProperties.xOffsetFromLeft) },
    { label: t('y_offset'), value: toFixed(wellProperties.yOffsetFromTop) },
    {
      label: t('x_spacing'),
      value:
        wellProperties.xSpacing != null
          ? toFixed(wellProperties.xSpacing)
          : t('various'),
    },
    {
      label: t('y_spacing'),
      value:
        wellProperties.ySpacing != null
          ? toFixed(wellProperties.ySpacing)
          : t('various'),
    },
  ]
  const shape = wellProperties.shape?.shape

  const diagram = getSpacingDiagram({
    category: category,
    guideType: 'spacing',
    shape: shape,
    isMultiRow: isMultiRow,
  }).map((src, index) => <img width="250px" src={src} key={index} />)

  return (
    <>
      <ExpandingTitle
        label={`${t('spacing')} ${labelSuffix != null ? labelSuffix : ''}`}
        diagram={diagram}
      />
      {spacing.map((s, index) => (
        <LabeledValue key={index} label={s.label} value={s.value} />
      ))}
    </>
  )
}
