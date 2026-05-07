import { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_END,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LargeButton,
  OVERFLOW_AUTO,
  SPACING,
  StyledText,
  Tooltip,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'

import { LINK_BUTTON_STYLE } from '../../components/atoms'

import type { ReactNode } from 'react'

interface WizardBodyProps {
  stepNumber: number
  header: string
  children: ReactNode
  proceed: () => void
  disabled?: boolean
  goBack?: () => void
  subHeader?: string
  tooltipOnDisabled?: string
  subStepNumber?: number
}

const OT2_GIFS: Record<number, string> = {
  2: new URL(
    '../../assets/images/onboarding_animation_ot2_2.gif',
    import.meta.url
  ).href,
  3: new URL(
    '../../assets/images/onboarding_animation_ot2_3.gif',
    import.meta.url
  ).href,
  4: new URL(
    '../../assets/images/onboarding_animation_ot2_4.gif',
    import.meta.url
  ).href,
}

export function WizardBody(props: WizardBodyProps): JSX.Element {
  const {
    stepNumber,
    header,
    children,
    goBack,
    subHeader,
    proceed,
    disabled = false,
    tooltipOnDisabled,
    subStepNumber,
  } = props
  const { t } = useTranslation('shared')
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'top',
  })
  const [loaded, setLoaded] = useState<boolean>(false)

  useLayoutEffect(() => {
    setLoaded(false)
    const timeout = setTimeout(() => {
      setLoaded(true)
    }, 100)
    return () => {
      clearTimeout(timeout)
    }
  }, [subStepNumber])

  return (
    <Flex
      padding={SPACING.spacing16}
      gridGap={SPACING.spacing16}
      height="calc(100vh - 48px)"
    >
      <Flex
        width={subStepNumber === 5 ? '100%' : '60%'}
        padding={SPACING.spacing80}
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.white}
        borderRadius={BORDERS.borderRadius16}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        gridGap={SPACING.spacing24}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
          height="100%"
          overflowY={OVERFLOW_AUTO}
        >
          <StyledText
            color={COLORS.grey60}
            desktopStyle="bodyDefaultSemiBold"
            textTransform={TYPOGRAPHY.textTransformUppercase}
          >
            {t('shared:step_count', { current: stepNumber })}
          </StyledText>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing60}>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
              <StyledText desktopStyle="displayBold">{header}</StyledText>
              {subHeader != null ? (
                <StyledText
                  desktopStyle="headingLargeRegular"
                  color={COLORS.grey60}
                >
                  {subHeader}
                </StyledText>
              ) : null}
            </Flex>
            {children}
          </Flex>
        </Flex>
        <Flex
          alignSelf={goBack != null ? 'auto' : ALIGN_END}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
        >
          {goBack != null ? (
            <Btn onClick={goBack} css={LINK_BUTTON_STYLE} height="1.5rem">
              <StyledText desktopStyle="bodyLargeSemiBold">
                {t('go_back')}
              </StyledText>
            </Btn>
          ) : null}
          <Flex {...targetProps} maxHeight="3.5rem">
            <LargeButton
              disabled={disabled}
              onClick={proceed}
              iconName="arrow-right"
              buttonText={t('shared:confirm')}
              height="3.5rem"
              width="8.5625rem"
            />
          </Flex>
          {tooltipOnDisabled != null && disabled ? (
            <Tooltip tooltipProps={tooltipProps}>{tooltipOnDisabled}</Tooltip>
          ) : null}
        </Flex>
      </Flex>
      {subStepNumber === 5 ? null : (
        <Flex
          width="40%"
          css={css`
            opacity: ${loaded ? 1 : 0};
            transition: opacity 0.5s ease-in-out;
          `}
        >
          <img
            src={OT2_GIFS[stepNumber]}
            width="100%"
            alt={`OT-2 asset for onboarding flow page ${stepNumber}`}
            height="100%"
            css={css`
              object-fit: cover;
              border-radius: ${BORDERS.borderRadius16};
            `}
          />
        </Flex>
      )}
    </Flex>
  )
}
