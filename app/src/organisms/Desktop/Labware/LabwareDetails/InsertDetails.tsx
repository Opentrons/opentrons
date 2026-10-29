import {
  BORDERS,
  Box,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getUniqueWellProperties } from '@opentrons/shared-data'

import { getWellLabel } from './helpers/labels'
import { ManufacturerDetails } from './ManufacturerDetails'
import { WellDimensions } from './WellDimensions'
import { WellProperties } from './WellProperties'

import type { ReactNode } from 'react'
import type { LabwareDefinition } from '@opentrons/shared-data'

export interface InsertDetailsProps {
  definition: LabwareDefinition
}

export function InsertDetails(props: InsertDetailsProps): ReactNode {
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
                forwardedAs="h2"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
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
