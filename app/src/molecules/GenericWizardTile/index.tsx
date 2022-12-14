import * as React from 'react'
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
import { StyledText } from '../../atoms/text'
import { PrimaryButton } from '../../atoms/buttons'
import { NeedHelpLink } from '../../organisms/CalibrationPanels'

const CAPITALIZE_FIRST_LETTER_STYLE = css`
  &:first-letter {
    text-transform: uppercase;
  }
`
export interface GenericWizardTileProps {
  rightHandBody: React.ReactNode
  bodyText: React.ReactNode
  header: string
  getHelp?: string
  back?: () => void
  proceed?: () => void
  proceedButtonText?: React.ReactNode
  proceedIsDisabled?: boolean
  proceedButton?: JSX.Element
}

const GO_BACK_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.darkGreyEnabled};

  &:hover {
    opacity: 70%;
  }
`

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
  } = props
  const { t } = useTranslation('shared')

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
          <StyledText as="h1">{header}</StyledText>
          {bodyText}
        </Flex>
        <Flex flex="1" justifyContent={JUSTIFY_CENTER}>
          {rightHandBody}
        </Flex>
      </Flex>
      <Flex justifyContent={buttonPositioning} alignItems={ALIGN_FLEX_END}>
        {back != null ? (
          <Btn onClick={back}>
            <StyledText css={GO_BACK_BUTTON_STYLE}>{t('go_back')}</StyledText>
          </Btn>
        ) : null}
        {getHelp != null ? <NeedHelpLink href={getHelp} /> : null}
        {proceed != null && proceedButton == null ? (
          <PrimaryButton
            disabled={proceedIsDisabled}
            css={CAPITALIZE_FIRST_LETTER_STYLE}
            onClick={proceed}
          >
            {proceedButtonText}
          </PrimaryButton>
        ) : null}
        {proceed == null && proceedButton != null ? proceedButton : null}
      </Flex>
    </Flex>
  )
}
