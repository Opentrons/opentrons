import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  COLORS,
  DIRECTION_ROW,
  SPACING,
  Btn,
  Icon,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'

interface CurrentRunningProtocolProps {
  runId: string
}

export function CurrentRunningProtocol({
  runId,
}: CurrentRunningProtocolProps): JSX.Element {
  const { t } = useTranslation('run_details')
  return (
    <Flex>
      <StyledText>{t('status_running')}</StyledText>
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing5}>
        <Icon name="close-circle" size="12.5rem" />
        <Icon name="pause-circle" size="12.5rem" />
      </Flex>
      <StyledText>{runId}</StyledText>
    </Flex>
  )
}
