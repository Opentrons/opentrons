import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, JUSTIFY_SPACE_EVENLY, DIRECTION_COLUMN } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'

interface ExitConfirmationProps {
  onGoBack: () => void
  onConfirmExit: () => void
}

export const ExitConfirmation = (
  props: ExitConfirmationProps
): JSX.Element => {
  const { t } = useTranslation('labware_position_check')
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <StyledText as="h3" >
        {t('exit_screen_title')}
      </StyledText>
      <StyledText as="p">
        {t('exit_screen_subtitle')}
      </StyledText>
      <Flex justifyContent={JUSTIFY_SPACE_EVENLY}>
        <SecondaryButton onClick={props.onGoBack}>
          {t('exit_screen_go_back')}
        </SecondaryButton>
        <PrimaryButton onClick={props.onConfirmExit}>
          {t('exit_screen_confirm_exit')}
        </PrimaryButton>
      </Flex>
    </Flex>
  )
}
