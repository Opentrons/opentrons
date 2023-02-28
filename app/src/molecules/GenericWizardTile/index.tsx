import * as React from 'react'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_ROW,
  TYPOGRAPHY,
  COLORS,
  Btn,
  ALIGN_FLEX_END,
  JUSTIFY_FLEX_END,
  JUSTIFY_START,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { ODD_MEDIA_QUERY_SPECS } from '@opentrons/shared-data'
import { getIsOnDevice } from '../../redux/config'
import { StyledText } from '../../atoms/text'
import { PrimaryButton } from '../../atoms/buttons'
import { NeedHelpLink } from '../../organisms/CalibrationPanels'
import { SmallButton } from '../../atoms/buttons/ODD'

const CAPITALIZE_FIRST_LETTER_STYLE = css`
  &:first-letter {
    text-transform: uppercase;
  }
`
const GO_BACK_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.darkGreyEnabled};

  &:hover {
    opacity: 70%;
  }

  @media ${ODD_MEDIA_QUERY_SPECS} {
    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
    font-size: 1.375rem;

    &:hover {
      opacity: 100%;
    }
  }
`
const GO_BACK_BUTTON_DISABLED_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.darkGreyEnabled};
  opacity: 70%;
`
const HEADER_STYLE = css`
  ${TYPOGRAPHY.h1Default};

  @media ${ODD_MEDIA_QUERY_SPECS} {
    font-size: 1.75rem;
    font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
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
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      height="24.625rem"
      padding={SPACING.spacing6}
    >
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacingXXL}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          flex="1"
          gridGap={SPACING.spacing3}
        >
          {typeof header === 'string' ? (
            <StyledText css={HEADER_STYLE}>{header}</StyledText>
          ) : (
            header
          )}
          {bodyText}
        </Flex>
        <Flex flex="1" justifyContent={JUSTIFY_CENTER}>
          {rightHandBody}
        </Flex>
      </Flex>
      <Flex justifyContent={buttonPositioning} alignItems={ALIGN_FLEX_END}>
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
            <SmallButton
              marginTop="4rem"
              disabled={proceedIsDisabled}
              css={CAPITALIZE_FIRST_LETTER_STYLE}
              onClick={proceed}
              aria-label="isOnDevice_button"
            >
              <StyledText
                fontSize="1.375rem"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                padding={SPACING.spacing4}
              >
                {proceedButtonText}
              </StyledText>
            </SmallButton>
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
