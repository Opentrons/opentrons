import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { LabwareCard } from './LabwareCard'
import { useGetAllLabware } from './hooks'

export function Labware(): JSX.Element {
  const { t } = useTranslation('labware_landing')

  const labware = useGetAllLabware()
  return (
    <Box paddingX={SPACING.spacing4} paddingY={SPACING.spacing5}>
      <StyledText
        as="h1"
        textTransform={TYPOGRAPHY.textTransformCapitalize}
        paddingBottom={SPACING.spacing5}
      >
        {t('labware')}
      </StyledText>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing2}>
        {labware.map(labware => (
          <LabwareCard
            key={labware.definition.metadata.displayName}
            labware={labware}
          />
        ))}
      </Flex>
    </Box>
  )
}
