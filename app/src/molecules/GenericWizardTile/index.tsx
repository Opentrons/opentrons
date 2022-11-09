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
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { PrimaryButton } from '../../atoms/buttons'
import { NeedHelpLink } from '../../organisms/CalibrationPanels'

export interface GenericWizardTileProps {
  rightHandBody: React.ReactNode
  bodyText: React.ReactNode
  header: string
  getHelp?: string
  back?: () => void
  proceed?: () => void
  proceedButtonText?: string
  proceedIsDisabled?: boolean
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
  } = props
  const { t } = useTranslation('shared')

  let buttonPositioning: string = ''
  if ((back != null || getHelp != null) && proceed != null) {
    buttonPositioning = JUSTIFY_SPACE_BETWEEN
  } else if (back == null && getHelp == null && proceed != null) {
    buttonPositioning = JUSTIFY_FLEX_END
  } else if ((back != null || getHelp != null) && proceed == null) {
    buttonPositioning = JUSTIFY_START
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} height="24.6rem">
      <Flex
        flexDirection={DIRECTION_ROW}
        paddingX={SPACING.spacing6}
        paddingTop={SPACING.spacing6}
        marginBottom={SPACING.spacing7}
        gridGap={SPACING.spacingXXL}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          flex="1"
          gridGap={SPACING.spacing4}
        >
          <StyledText as="h1">{header}</StyledText>
          {bodyText}
        </Flex>
        <Flex flex="1">{rightHandBody}</Flex>
      </Flex>
      <Flex
        justifyContent={buttonPositioning}
        marginBottom={SPACING.spacing6}
        marginX={SPACING.spacing6}
        alignItems={ALIGN_FLEX_END}
        flex="1"
      >
        {back != null ? (
          <Btn onClick={back}>
            <StyledText css={GO_BACK_BUTTON_STYLE}>{t('go_back')}</StyledText>
          </Btn>
        ) : null}
        {getHelp != null ? <NeedHelpLink href={getHelp} /> : null}
        <PrimaryButton disabled={proceedIsDisabled} onClick={proceed}>
          {proceedButtonText}
        </PrimaryButton>
      </Flex>
    </Flex>
  )
}
