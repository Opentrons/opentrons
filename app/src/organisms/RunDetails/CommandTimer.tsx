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
import { formatInterval } from '../RunTimeControl/utils'

const EMPTY_TIMESTAMP = '-- : -- : --'
interface TimerProps {
  commandStartedAt: string | null
  commandCompletedAt: string | null
  runStartedAt: string | null
}
export function CommandTimer(props: TimerProps): JSX.Element | null {
  const { commandStartedAt, commandCompletedAt, runStartedAt } = props
  const { t } = useTranslation('run_details')

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      textTransform={TEXT_TRANSFORM_UPPERCASE}
      fontSize={FONT_SIZE_CAPTION}
      fontWeight={FONT_WEIGHT_REGULAR}
      marginRight={SPACING_2}
    >
      <Flex>
        <Flex marginRight={SPACING_1}>{t('start_step_time')}</Flex>
        <Flex>
          {commandStartedAt != null && runStartedAt != null
            ? formatInterval(runStartedAt, commandStartedAt)
            : EMPTY_TIMESTAMP}
        </Flex>
      </Flex>
      <Flex>
        <Flex marginRight={SPACING_1}>{t('end_step_time')}</Flex>
        <Flex marginLeft={SPACING_2}>
          {commandCompletedAt && runStartedAt != null
            ? formatInterval(runStartedAt, commandCompletedAt)
            : EMPTY_TIMESTAMP}
        </Flex>
      </Flex>
    </Flex>
  )
}
