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
}

const GO_BACK_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
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
  } = props
  const { t } = useTranslation('shared')

  return (
    <>
      <Flex
        flexDirection={DIRECTION_ROW}
        paddingX={SPACING.spacing6}
        paddingTop={SPACING.spacing6}
        marginBottom={SPACING.spacing7}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          width="50%"
          marginRight={SPACING.spacingXXL}
        >
          <StyledText as="h1" marginBottom={SPACING.spacing4}>
            {header}
          </StyledText>
          {bodyText}
        </Flex>
        {rightHandBody}
      </Flex>
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        marginBottom={SPACING.spacing6}
        marginX={SPACING.spacing6}
        alignItems={ALIGN_FLEX_END}
      >
        {back != null ? (
          <Btn onClick={back}>
            <StyledText css={GO_BACK_BUTTON_STYLE}>{t('go_back')}</StyledText>
          </Btn>
        ) : null}
        {getHelp != null ? <NeedHelpLink href={getHelp} /> : null}
        <PrimaryButton onClick={proceed}>{proceedButtonText}</PrimaryButton>
      </Flex>
    </>
  )
}
