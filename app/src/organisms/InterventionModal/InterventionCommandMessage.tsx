import { useTranslation } from 'react-i18next'

import { Flex, StyledText } from '@opentrons/components'

import styles from './interventioncommandmessage.module.css'

import type { ReactNode } from 'react'

export interface InterventionCommandMessageProps {
  commandMessage: string | null
}

export function InterventionCommandMessage({
  commandMessage,
}: InterventionCommandMessageProps): ReactNode {
  const { t } = useTranslation('protocol_command_text')

  return (
    <Flex className={styles.container}>
      <StyledText className={styles.notes}>{t('notes')}</StyledText>
      <StyledText className={styles.message}>
        {commandMessage != null && commandMessage !== ''
          ? commandMessage.length > 220
            ? `${commandMessage.substring(0, 217)}...`
            : commandMessage
          : t('wait_for_resume')}
      </StyledText>
    </Flex>
  )
}
