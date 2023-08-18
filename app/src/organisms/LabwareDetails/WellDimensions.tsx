import * as React from 'react'
import { useTranslation } from 'react-i18next'
import round from 'lodash/round'
import { Box, SPACING, getMeasurementDiagram } from '@opentrons/components'
import { LabeledValue } from './StyledComponents/LabeledValue'
import { ExpandingTitle } from './StyledComponents/ExpandingTitle'

import type {
  LabwareWellGroupProperties,
  LabwareParameters,
} from '../../pages/Labware/types'

const toFixed = (n: number): string => round(n, 2).toFixed(2)

export interface WellDimensionsProps {
  labwareParams: LabwareParameters
  wellProperties: LabwareWellGroupProperties
  wellLabel: string
  category: string
  labelSuffix?: string
}

export function WellDimensions(props: WellDimensionsProps): JSX.Element {
  const { t } = useTranslation('labware_details')
  const {
    labwareParams,
    wellProperties,
    wellLabel,
    labelSuffix,
    category,
  } = props
  const {
    shape,
    depth,
    metadata: { wellBottomShape },
  } = wellProperties
  const { isTiprack, tipLength } = labwareParams
  const dimensions = []

  if (isTiprack && tipLength != null) {
    dimensions.push({ label: t('total_length'), value: toFixed(tipLength) })
  } else if (depth != null) {
    dimensions.push({ label: t('depth'), value: toFixed(depth) })
  }

  if (shape != null) {
    if (shape.shape === 'circular') {
      dimensions.push({ label: t('diameter'), value: toFixed(shape.diameter) })
    } else if (shape.shape === 'rectangular') {
      dimensions.push(
        { label: t('x_size'), value: toFixed(shape.xDimension) },
        { label: t('y_size'), value: toFixed(shape.yDimension) }
      )
    }
  }

  const diagram = getMeasurementDiagram({
    category: category,
    guideType: 'measurements',
    shape: shape?.shape,
    wellBottomShape: wellBottomShape,
  })?.map((src, index) => <img width="250px" src={src} key={index} />)

  return (
    <Box marginBottom={SPACING.spacing16}>
      <ExpandingTitle
        label={`${t(wellLabel)} ${t('measurements')} ${
          labelSuffix != null ? labelSuffix : ''
        }`}
        diagram={diagram.length > 0 ? diagram : null}
      />
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
