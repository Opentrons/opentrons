import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAtom } from 'jotai'
import { css } from 'styled-components'

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

import { Privacy } from '/ai-client/components/organisms/Settings'
import { featureFlagsAtom } from '/ai-client/resources/atoms'

const SETTINGS_MAX_WIDTH = '56rem'

export function Settings(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const navigate = useNavigate()
  const [featureFlags, setFeatureFlags] = useAtom(featureFlagsAtom)

  const handleToggleAnalytics = (): void => {
    const currentValue = featureFlags.enableAnalytics ?? true
    const newValue = !currentValue
    setFeatureFlags({
      enableAnalytics: newValue,
    })
  }

  const handleBackClick = (): void => {
    navigate(-1)
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
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing20}>
            <Btn
              onClick={handleBackClick}
              css={BACK_BUTTON_STYLE}
              data-testid="back-button"
              aria-label="Back"
            >
              <Flex
                flexDirection={DIRECTION_ROW}
                alignItems={ALIGN_CENTER}
                gridGap={SPACING.spacing4}
              >
                <Icon name="arrow-left" size="1.5rem" color={COLORS.grey60} />
                <StyledText desktopStyle="bodyDefaultSemiBold">
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
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

const BACK_BUTTON_STYLE = css`
  padding: 0;
  margin-left: -0.5rem;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: transparent;
  border: none;
  cursor: pointer;
  width: fit-content;

  &:hover {
    background: transparent;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.yellow50};
  }
`
