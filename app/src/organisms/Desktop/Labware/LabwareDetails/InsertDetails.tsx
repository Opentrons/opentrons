import {
  BORDERS,
  Box,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getUniqueWellProperties } from '@opentrons/shared-data'
import { getWellLabel } from './helpers/labels'
import { WellProperties } from './WellProperties'
import { WellDimensions } from './WellDimensions'
import { ManufacturerDetails } from './ManufacturerDetails'

import type { LabwareDefinition2 as LabwareDefinition } from '@opentrons/shared-data'

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
              <LegacyStyledText
                css={TYPOGRAPHY.h2SemiBold}
                paddingBottom={SPACING.spacing8}
              >
                {wellProps.metadata.displayName}
              </LegacyStyledText>
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
