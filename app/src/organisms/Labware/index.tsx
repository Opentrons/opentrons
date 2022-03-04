import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { SecondaryButton } from '../../atoms/Buttons'
import { LabwareCard } from './LabwareCard'
import { AddCustomLabware } from './AddCustomLabware'
import { useGetAllLabware } from './hooks'

export function Labware(): JSX.Element {
  const { t } = useTranslation('labware_landing')

  const labware = useGetAllLabware()
  const [showAddLabwareSlideout, setShowAddLabwareSlideout] = React.useState(
    false
  )

  return (
    <>
      <Box paddingX={SPACING.spacing4} paddingY={SPACING.spacing5}>
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
          paddingBottom={SPACING.spacing5}
        >
          <StyledText
            as="h1"
            textTransform={TYPOGRAPHY.textTransformCapitalize}
          >
            {t('labware')}
          </StyledText>
          <SecondaryButton onClick={() => setShowAddLabwareSlideout(true)}>
            {t('import')}
          </SecondaryButton>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing2}>
          {labware.map(labware => (
            <LabwareCard
              key={labware.definition.metadata.displayName}
              labware={labware}
            />
          ))}
        </Flex>
      </Box>
      {showAddLabwareSlideout && (
        <AddCustomLabware
          isExpanded={showAddLabwareSlideout}
          onCloseClick={() => setShowAddLabwareSlideout(false)}
        />
      )}
    </>
  )
}
