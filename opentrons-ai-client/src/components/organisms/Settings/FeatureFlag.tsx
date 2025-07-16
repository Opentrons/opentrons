import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { ToggleButton } from '../../../molecules/ToggleButton'

interface FeatureFlagProps {
  enablePDProtocolGeneration: boolean
  onTogglePDProtocolGeneration: () => void
}

export function FeatureFlag({
  enablePDProtocolGeneration,
  onTogglePDProtocolGeneration,
}: FeatureFlagProps): JSX.Element {
  const { t } = useTranslation('protocol_generator')

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
      <StyledText desktopStyle="bodyLargeSemiBold">
        {t('feature_flags')}
      </StyledText>
      <ListItem
        type="default"
        padding={SPACING.spacing16}
        flexDirection={DIRECTION_COLUMN}
      >
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText desktopStyle="bodyDefaultSemiBold">
              Protocol Designer Protocol Generation
            </StyledText>
            <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
              Enable Protocol Designer protocol generation features
            </StyledText>
          </Flex>
          <ToggleButton
            label="pd-protocol-generation-toggle"
            toggledOn={enablePDProtocolGeneration}
            onClick={onTogglePDProtocolGeneration}
          />
        </Flex>
      </ListItem>
    </Flex>
  )
}
