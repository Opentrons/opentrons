import { useTranslation } from 'react-i18next'
import { useAtom } from 'jotai'

import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  ListItem,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { ToggleButton } from '../../molecules/ToggleButton'
import { featureFlagsAtom } from '../../resources/atoms'

export function Settings(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const [featureFlags, setFeatureFlags] = useAtom(featureFlagsAtom)

  const handleToggleAnalytics = (): void => {
    const currentValue = featureFlags.enableAnalytics ?? true
    const newValue = !currentValue
    console.log('Toggle clicked - current:', currentValue, 'new:', newValue)
    setFeatureFlags({
      enableAnalytics: newValue,
    })
  }

  const handleTogglePDProtocolGeneration = (): void => {
    const currentValue = featureFlags.enablePDProtocolGeneration ?? true
    const newValue = !currentValue
    setFeatureFlags({
      enablePDProtocolGeneration: newValue,
    })
  }

  const handleBackClick = (): void => {
    window.location.hash = '/'
  }

  return (
    <Flex
      width="100%"
      justifyContent={JUSTIFY_CENTER}
      backgroundColor={COLORS.grey10}
      padding={`${SPACING.spacing60} ${SPACING.spacing80} ${SPACING.spacing80}`}
    >
      <Flex width="100%" maxWidth="56rem" height="100%">
        <Flex
          backgroundColor={COLORS.white}
          padding={SPACING.spacing40}
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing40}
          borderRadius={BORDERS.borderRadius8}
          width="100%"
          height={featureFlags.enablePrereleaseMode ? 'auto' : '20rem'}
          minHeight="20rem"
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
            <Btn
              onClick={handleBackClick}
              css="padding: 0; margin-left: -0.5rem; display: flex; align-items: center; justify-content: flex-start; background: transparent; border: none; cursor: pointer; width: fit-content;"
              data-testid="back-button"
              aria-label="Back"
            >
              <Flex
                flexDirection={DIRECTION_ROW}
                alignItems={ALIGN_CENTER}
                gridGap={SPACING.spacing4}
              >
                <Icon name="arrow-left" size="1.5rem" color={COLORS.grey60} />
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  color={COLORS.grey60}
                  css="font-size: 1rem;"
                >
                  {t('back')}
                </StyledText>
              </Flex>
            </Btn>
            <StyledText desktopStyle="headingLargeBold">
              {t('settings')}
            </StyledText>
          </Flex>

          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            <StyledText desktopStyle="bodyLargeSemiBold">
              {t('privacy')}
            </StyledText>
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
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  color={COLORS.grey60}
                >
                  {t('share_analytics_description')}
                </StyledText>
              </Flex>
              <ToggleButton
                label="analytics-toggle"
                toggledOn={featureFlags.enableAnalytics ?? true}
                onClick={handleToggleAnalytics}
              />
            </ListItem>
          </Flex>

          {featureFlags.enablePrereleaseMode && (
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              <StyledText desktopStyle="bodyLargeSemiBold">
                {t('feature_flags')}
              </StyledText>
              <ListItem
                padding={SPACING.spacing16}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                type="default"
                gridGap={SPACING.spacing40}
                alignItems={ALIGN_CENTER}
              >
                <Flex flexDirection={DIRECTION_COLUMN}>
                  <StyledText desktopStyle="bodyDefaultSemiBold">
                    Protocol Designer Protocol Generation
                  </StyledText>
                  <StyledText
                    desktopStyle="bodyDefaultRegular"
                    color={COLORS.grey60}
                  >
                    Enable Protocol Designer protocol generation features
                  </StyledText>
                </Flex>
                <ToggleButton
                  label="pd-protocol-generation-toggle"
                  toggledOn={featureFlags.enablePDProtocolGeneration ?? true}
                  onClick={handleTogglePDProtocolGeneration}
                />
              </ListItem>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}
