import * as React from 'react'
import { Box, SPACING, BORDERS, TYPOGRAPHY } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { getUniqueWellProperties } from './helpers/labwareInference'
import { getWellLabel } from './helpers/labels'
import { WellProperties } from './WellProperties'
import { WellDimensions } from './WellDimensions'
import { ManufacturerDetails } from './ManufacturerDetails'

import type { LabwareDefinition } from '../../pages/Labware/types'

export interface InsertDetailsProps {
  definition: LabwareDefinition
}

export function InsertDetails(props: InsertDetailsProps): JSX.Element {
  const { definition } = props
  const { metadata, parameters } = definition
  const { displayVolumeUnits, displayCategory } = metadata
  const wellGroups = getUniqueWellProperties(definition)
  return (
    <>
      {wellGroups.map((wellProps, index) => {
        const wellLabel = getWellLabel(wellProps, definition)

        return (
          <Box
            border={BORDERS.lineBorder}
            key={index}
            marginY={SPACING.spacing4}
          >
            <Box padding={SPACING.spacing4}>
              <StyledText
                css={TYPOGRAPHY.h2SemiBold}
                paddingBottom={SPACING.spacing3}
              >
                {wellProps.metadata.displayName}
              </StyledText>
              <WellProperties
                wellProperties={wellProps}
                wellLabel={wellLabel}
                displayVolumeUnits={displayVolumeUnits}
              />
              <WellDimensions
                category={displayCategory}
                labwareParams={parameters}
                wellProperties={wellProps}
                wellLabel={wellLabel}
              />
            </Box>
            {wellProps.brand != null && (
              <ManufacturerDetails brand={wellProps.brand} />
            )}
          </Box>
        )
      })}
    </>
  )
}
