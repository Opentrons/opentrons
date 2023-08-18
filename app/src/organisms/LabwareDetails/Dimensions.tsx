import * as React from 'react'
import { useTranslation } from 'react-i18next'
import round from 'lodash/round'
import { Box, SPACING, getFootprintDiagram } from '@opentrons/components'
import { LabeledValue } from './StyledComponents/LabeledValue'
import { ExpandingTitle } from './StyledComponents/ExpandingTitle'
import type { LabwareDefinition } from '../../pages/Labware/types'

const toFixed = (n: number): string => round(n, 2).toFixed(2)

export interface DimensionsProps {
  definition: LabwareDefinition
  irregular?: boolean
  insertCategory?: string
}

export function Dimensions(props: DimensionsProps): JSX.Element {
  const { t } = useTranslation('labware_details')
  const { definition, irregular, insertCategory } = props
  const { displayCategory } = definition.metadata
  const { xDimension, yDimension, zDimension } = definition.dimensions
  const dimensions = [
    { label: t('length'), value: toFixed(xDimension) },
    { label: t('width'), value: toFixed(yDimension) },
    { label: t('height'), value: toFixed(zDimension) },
  ]

  const diagram = getFootprintDiagram({
    category: displayCategory,
    guideType: 'footprint',
    insertCategory: insertCategory,
    irregular: irregular,
  })?.map((src, index) => <img width="250px" src={src} key={index} />)

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
