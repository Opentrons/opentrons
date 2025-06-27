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

interface PrivacyProps {
  enableAnalytics: boolean
  onToggleAnalytics: () => void
}

export function Privacy({
  enableAnalytics,
  onToggleAnalytics,
}: PrivacyProps): JSX.Element {
  const { t } = useTranslation('protocol_generator')

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing8}
      height="100%"
    >
      <StyledText desktopStyle="bodyLargeSemiBold">{t('privacy')}</StyledText>
      <ListItem
        padding={SPACING.spacing16}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        type="default"
        gridGap={SPACING.spacing40}
        alignItems={ALIGN_CENTER}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('share_analytics_with_opentrons')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {t('share_analytics_description')}
          </StyledText>
        </Flex>
        <ToggleButton
          label="analytics-toggle"
          toggledOn={enableAnalytics}
          onClick={onToggleAnalytics}
        />
      </ListItem>
    </Flex>
  )
}
