import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { COLORS } from '@opentrons/components'
import { StyledText } from '../../atoms/text'

export interface InterventionCommandMessageProps {
  commandMessage: string | null
}

export function InterventionCommandMessage({
  commandMessage,
}: InterventionCommandMessageProps): JSX.Element {
  const { t, i18n } = useTranslation('protocol_command_text')

  return (
    <>
      <StyledText as="h6" color={COLORS.errorDisabled}>
        {i18n.format(t('notes'), 'upperCase')}:
      </StyledText>
      <StyledText as="p">
        {commandMessage != null && commandMessage !== ''
          ? commandMessage.length > 220
            ? `${commandMessage.substring(0, 217)}...`
            : commandMessage
          : t('wait_for_resume')}
      </StyledText>
    </>
  )
}
