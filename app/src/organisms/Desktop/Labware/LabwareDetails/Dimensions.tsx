import { useTranslation } from 'react-i18next'
import round from 'lodash/round'

import { Box, getFootprintDiagram, SPACING } from '@opentrons/components'
import { getSchema2Dimensions } from '@opentrons/shared-data'

import { ExpandingTitle } from './StyledComponents/ExpandingTitle'
import { LabeledValue } from './StyledComponents/LabeledValue'

import type { ReactNode } from 'react'
import type { LabwareDefinition } from '@opentrons/shared-data'

const toFixed = (n: number): string => round(n, 2).toFixed(2)

export interface DimensionsProps {
  definition: LabwareDefinition
  irregular?: boolean
  insertCategory?: string
}

export function Dimensions(props: DimensionsProps): ReactNode {
  const { t } = useTranslation('labware_details')
  const { definition, irregular, insertCategory } = props
  const { displayCategory, displayName } = definition.metadata
  const { xDimension, yDimension, zDimension } =
    getSchema2Dimensions(definition)
  const dimensions = [
    { label: t('length'), value: toFixed(xDimension) },
    { label: t('width'), value: toFixed(yDimension) },
    { label: t('height'), value: toFixed(zDimension) },
  ]

  const diagram = getFootprintDiagram({
    category: displayCategory,
    guideType: 'footprint',
    insertCategory,
    irregular,
  })?.map(src => (
    <img width="250px" src={src} key={src} alt={`Image of ${displayName}`} />
  ))

  return (
    <Box marginBottom={SPACING.spacing16}>
      <ExpandingTitle label={t('footprint')} diagram={diagram} />
      {dimensions.map(d => (
        <LabeledValue
          key={`${d.label}_${d.value}`}
          label={d.label}
          value={d.value}
        />
      ))}
    </Box>
  )
}
