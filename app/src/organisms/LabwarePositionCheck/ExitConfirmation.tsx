import * as React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Icon,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  SPACING,
  SIZE_3,
  AlertPrimaryButton,
  JUSTIFY_CENTER,
  COLORS,
  TYPOGRAPHY,
  RESPONSIVENESS,
  SecondaryButton,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { NeedHelpLink } from '../CalibrationPanels'

const LPC_HELP_LINK_URL =
  'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'
interface ExitConfirmationProps {
  onGoBack: () => void
  onConfirmExit: () => void
}

export const ExitConfirmation = (props: ExitConfirmationProps): JSX.Element => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const { onGoBack, onConfirmExit } = props
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING.spacing32}
      minHeight="25rem"
    >
      <Flex
        flex="1"
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
      >
        <Icon name="ot-check" size={SIZE_3} color={COLORS.warningEnabled} />
        <ConfirmationHeader>{t('exit_screen_title')}</ConfirmationHeader>
        <StyledText as="p" marginTop={SPACING.spacing8}>
          {t('exit_screen_subtitle')}
        </StyledText>
      </Flex>
      <Flex
        width="100%"
        marginTop={SPACING.spacing32}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <NeedHelpLink href={LPC_HELP_LINK_URL} />
        <Flex gridGap={SPACING.spacing8}>
          <SecondaryButton onClick={onGoBack}>
            {t('shared:go_back')}
          </SecondaryButton>
          <AlertPrimaryButton
            onClick={onConfirmExit}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
          >
            {t('shared:exit')}
          </AlertPrimaryButton>
        </Flex>
      </Flex>
    </Flex>
  )
}

const ConfirmationHeader = styled.h1`
  margin-top: ${SPACING.spacing24};
  ${TYPOGRAPHY.h1Default}
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold}
  }
`
