import { useTranslation } from 'react-i18next'
import { useAtom } from 'jotai'

import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { FeatureFlag, Privacy } from '../../components/organisms/Settings'
import { featureFlagsAtom } from '../../resources/atoms'

const SETTINGS_MAX_WIDTH = '56rem'

export function Settings(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const [featureFlags, setFeatureFlags] = useAtom(featureFlagsAtom)

  const prereleaseModeEnabled = featureFlags.enablePrereleaseMode === true

  const handleToggleAnalytics = (): void => {
    const currentValue = featureFlags.enableAnalytics ?? true
    const newValue = !currentValue
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
      <Flex width="100%" maxWidth={SETTINGS_MAX_WIDTH} height="100%">
        <Flex
          backgroundColor={COLORS.white}
          padding={SPACING.spacing40}
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing40}
          borderRadius={BORDERS.borderRadius8}
          width="100%"
          height="100%"
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

          <Flex
            height="100%"
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing24}
          >
            <Privacy
              enableAnalytics={featureFlags.enableAnalytics ?? true}
              onToggleAnalytics={handleToggleAnalytics}
            />
            {prereleaseModeEnabled ? (
              <FeatureFlag
                enablePDProtocolGeneration={
                  featureFlags.enablePDProtocolGeneration ?? true
                }
                onTogglePDProtocolGeneration={handleTogglePDProtocolGeneration}
              />
            ) : null}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
