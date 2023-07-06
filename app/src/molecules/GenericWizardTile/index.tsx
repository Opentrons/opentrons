import * as React from 'react'
import { useSelector } from 'react-redux'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_ROW,
  TYPOGRAPHY,
  COLORS,
  Btn,
  JUSTIFY_FLEX_END,
  JUSTIFY_START,
  JUSTIFY_CENTER,
  PrimaryButton,
  RESPONSIVENESS,
} from '@opentrons/components'
import { getIsOnDevice } from '../../redux/config'
import { StyledText } from '../../atoms/text'
import { NeedHelpLink } from '../../organisms/CalibrationPanels'
import { SmallButton } from '../../atoms/buttons'

const CAPITALIZE_FIRST_LETTER_STYLE = css`
  &:first-letter {
    text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  }
`
const GO_BACK_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.darkGreyEnabled};

  &:hover {
    opacity: 70%;
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
    font-size: ${TYPOGRAPHY.fontSize22};

    &:hover {
      opacity: 100%;
    }
  }
`
const GO_BACK_BUTTON_DISABLED_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.darkBlack70};
`
const Title = styled.h1`
  ${TYPOGRAPHY.h1Default};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold};
    height: ${SPACING.spacing40};
  }
`

const TILE_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  padding: ${SPACING.spacing32};
  height: 24.625rem;
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: 29.5rem;
  }
`
export interface GenericWizardTileProps {
  rightHandBody: React.ReactNode
  bodyText: React.ReactNode
  header: string | React.ReactNode
  getHelp?: string
  back?: () => void
  proceed?: () => void
  proceedButtonText?: React.ReactNode
  proceedIsDisabled?: boolean
  proceedButton?: JSX.Element
  backIsDisabled?: boolean
}

export function GenericWizardTile(props: GenericWizardTileProps): JSX.Element {
  const {
    rightHandBody,
    bodyText,
    header,
    getHelp,
    back,
    proceed,
    proceedButtonText,
    proceedIsDisabled,
    proceedButton,
    backIsDisabled,
  } = props
  const { t } = useTranslation('shared')
  const isOnDevice = useSelector(getIsOnDevice)

  let buttonPositioning: string = ''
  if (
    (back != null || getHelp != null) &&
    (proceedButton != null || proceed != null)
  ) {
    buttonPositioning = JUSTIFY_SPACE_BETWEEN
  } else if (
    back == null &&
    getHelp == null &&
    (proceedButton != null || proceed != null)
  ) {
    buttonPositioning = JUSTIFY_FLEX_END
  } else if ((back != null || getHelp != null) && proceed == null) {
    buttonPositioning = JUSTIFY_START
  }

  return (
    <Flex css={TILE_CONTAINER_STYLE}>
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing24}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          flex="1"
          gridGap={SPACING.spacing8}
        >
          {typeof header === 'string' ? <Title>{header}</Title> : header}
          <StyledText as="p">{bodyText}</StyledText>
        </Flex>
        <Flex flex="1" justifyContent={JUSTIFY_CENTER}>
          {rightHandBody}
        </Flex>
      </Flex>
      <Flex justifyContent={buttonPositioning} alignItems={ALIGN_CENTER}>
        {back != null ? (
          <Btn onClick={back} disabled={backIsDisabled} aria-label="back">
            <StyledText
              css={
                backIsDisabled ?? false
                  ? GO_BACK_BUTTON_DISABLED_STYLE
                  : GO_BACK_BUTTON_STYLE
              }
            >
              {t('go_back')}
            </StyledText>
          </Btn>
        ) : null}
        {getHelp != null ? <NeedHelpLink href={getHelp} /> : null}
        {proceed != null && proceedButton == null ? (
          isOnDevice ? (
            <SmallButton buttonText={proceedButtonText} onClick={proceed} />
          ) : (
            <PrimaryButton
              disabled={proceedIsDisabled}
              css={CAPITALIZE_FIRST_LETTER_STYLE}
              onClick={proceed}
            >
              {proceedButtonText}
            </PrimaryButton>
          )
        ) : null}
        {proceed == null && proceedButton != null ? proceedButton : null}
      </Flex>
    </Flex>
  )
}
