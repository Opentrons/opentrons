import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Text,
  Flex,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { LabwareCard } from './LabwareCard'
import { useGetAllLabware } from './hooks'

export function Labware(): JSX.Element {
  const { t } = useTranslation('labware_landing')

  const labware = useGetAllLabware()
  return (
    <Box paddingX={SPACING.spacing4} paddingY={SPACING.spacing5}>
      <Text
        css={TYPOGRAPHY.h1Default}
        textTransform={TYPOGRAPHY.textTransformCapitalize}
        color={COLORS.black}
        paddingBottom={SPACING.spacing5}
      >
        {t('labware')}
      </Text>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing2}>
        {labware.map(labware => (
          <LabwareCard key={labware.definition.version} labware={labware} />
        ))}
      </Flex>
    </Box>
  )
}
