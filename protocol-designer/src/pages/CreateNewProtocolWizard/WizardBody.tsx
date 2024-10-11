import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  ALIGN_END,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LargeButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import temporaryImg from '../../assets/images/placeholder_image_delete.png'
import { BUTTON_LINK_STYLE } from '../../atoms'

interface WizardBodyProps {
  stepNumber: number
  header: string
  children: React.ReactNode
  proceed: () => void
  disabled?: boolean
  goBack?: () => void
  subHeader?: string
  imgSrc?: string
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
    imgSrc,
  } = props
  const { t } = useTranslation('shared')

  return (
    <Flex
      padding={SPACING.spacing16}
      gridGap={SPACING.spacing16}
      height="calc(100vh - 48px)"
    >
      <Flex
        width="60%"
        padding={`${SPACING.spacing40} ${SPACING.spacing80} ${SPACING.spacing80} ${SPACING.spacing80}`}
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.white}
        borderRadius={BORDERS.borderRadius16}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
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
        >
          {goBack != null ? (
            <Btn onClick={goBack} css={BUTTON_LINK_STYLE}>
              <StyledText desktopStyle="bodyLargeSemiBold">
                {t('go_back')}
              </StyledText>
            </Btn>
          ) : null}
          <LargeButton
            ariaDisabled={disabled}
            onClick={proceed}
            iconName="arrow-right"
            buttonText={t('shared:confirm')}
          />
        </Flex>
      </Flex>
      <StyledImg
        //    TODO(ja, 8/7/24): delete this and add real images!!
        src={imgSrc ?? temporaryImg}
        width="40%"
        height="100%"
      />
    </Flex>
  )
}

const StyledImg = styled.img`
  border-radius: ${BORDERS.borderRadius16};
  max-height: 844px;
`
