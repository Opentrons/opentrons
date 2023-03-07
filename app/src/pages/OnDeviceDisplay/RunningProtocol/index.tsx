import * as React from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Flex, Icon, Btn, DIRECTION_ROW, SPACING } from '@opentrons/components'

import { StyledText } from '../../../atoms/text'

import type { OnDeviceRouteParams } from '../../../App/types'

export function RunningProtocol(): JSX.Element {
  const { t } = useTranslation()
  const { runId } = useParams<OnDeviceRouteParams>()

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
