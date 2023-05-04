import { StyledText } from '../../atoms/text'
import type { LabwareDefinition } from '../../pages/Labware/types'
import { ManufacturerDetails } from './ManufacturerDetails'
import { WellDimensions } from './WellDimensions'
import { WellProperties } from './WellProperties'
import { getWellLabel } from './helpers/labels'
import { getUniqueWellProperties } from './helpers/labwareInference'
import { Box, SPACING, BORDERS, TYPOGRAPHY } from '@opentrons/components'
import * as React from 'react'

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
            marginY={SPACING.spacing16}
          >
            <Box padding={SPACING.spacing16}>
              <StyledText
                css={TYPOGRAPHY.h2SemiBold}
                paddingBottom={SPACING.spacing8}
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
