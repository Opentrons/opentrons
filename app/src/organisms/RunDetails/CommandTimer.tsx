import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  FONT_SIZE_CAPTION,
  FONT_WEIGHT_REGULAR,
  SPACING_1,
  SPACING_2,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import { useFormatRunTimestamp, useTimeElapsedSincePause } from './hooks'

const EMPTY_TIMESTAMP = '-- : -- : --'
interface TimerProps {
  commandStartedAt?: string | null
  commandCompletedAt?: string | null
}
export function CommandTimer(props: TimerProps): JSX.Element | null {
  const { commandStartedAt, commandCompletedAt } = props
  const { t } = useTranslation('run_details')
  const timeElapsedSincePause = useTimeElapsedSincePause()
  const formatRunTimestamp = useFormatRunTimestamp()

  if (commandStartedAt == null) return null // this state should never be reached, all command statuses with timer will have start time

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      textTransform={TEXT_TRANSFORM_UPPERCASE}
      fontSize={FONT_SIZE_CAPTION}
      fontWeight={FONT_WEIGHT_REGULAR}
    >
      <Flex>
        <Flex marginRight={SPACING_1}>{t('start_step_time')}</Flex>
        <Flex>{formatRunTimestamp(commandStartedAt)}</Flex>
      </Flex>

      {commandCompletedAt == null && timeElapsedSincePause != null ? (
        <Flex>
          <Flex marginRight={SPACING_1}>{t('current_step_pause_timer')}</Flex>
          <Flex>{timeElapsedSincePause}</Flex>
        </Flex>
      ) : null}
      <Flex>
        <Flex marginRight={SPACING_1}>{t('end_step_time')}</Flex>
        <Flex marginLeft={SPACING_2}>
          {commandCompletedAt
            ? formatRunTimestamp(commandCompletedAt)
            : EMPTY_TIMESTAMP}
        </Flex>
      </Flex>
    </Flex>
  )
}
