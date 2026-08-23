import { useTranslation } from 'react-i18next'
import round from 'lodash/round'

import { getSpacingDiagram } from '@opentrons/components'

import { ExpandingTitle } from './StyledComponents/ExpandingTitle'
import { LabeledValue } from './StyledComponents/LabeledValue'

import type { ReactNode } from 'react'
import type { LabwareWellGroupProperties } from '/app/local-resources/labware'

const toFixed = (n: number): string => round(n, 2).toFixed(2)

export interface WellSpacingProps {
  category?: string
  isMultiRow?: boolean
  wellProperties: LabwareWellGroupProperties
  labelSuffix?: string
  className?: string
}

export function WellSpacing(props: WellSpacingProps): ReactNode {
  const { t } = useTranslation('labware_details')
  const { labelSuffix, wellProperties, category, isMultiRow } = props

  const spacing = [
    { label: t('x_offset'), value: toFixed(wellProperties.xOffsetFromLeft) },
    { label: t('y_offset'), value: toFixed(wellProperties.yOffsetFromBack) },
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
    category,
    guideType: 'spacing',
    shape,
    isMultiRow,
  }).map(src => (
    <img
      width="250px"
      src={src}
      key={src}
      alt={`Image of ${labelSuffix ?? ''}`}
    />
  ))

  return (
    <>
      <ExpandingTitle
        label={`${t('spacing')} ${labelSuffix ?? ''}`}
        diagram={diagram}
      />
      {spacing.map((s, index) => (
        <LabeledValue key={index} label={s.label} value={s.value} />
      ))}
    </>
  )
}
