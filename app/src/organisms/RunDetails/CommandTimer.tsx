import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  FONT_SIZE_CAPTION,
  FONT_WEIGHT_REGULAR,
  SPACING_1,
  SPACING_2,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'

interface TimerProps {
  start: string
  timer?: string //    TODO: immediately update this to timer
  end: string
  runStatus?: string
}
export function CommandTimer(props: TimerProps): JSX.Element {
  const { t } = useTranslation('run_details')

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      textTransform={TEXT_TRANSFORM_UPPERCASE}
      fontSize={FONT_SIZE_CAPTION}
      fontWeight={FONT_WEIGHT_REGULAR}
    >
      <Flex flexDirection={DIRECTION_ROW}>
        <Flex marginRight={SPACING_1}>{t('start_step_time')}</Flex>
        <Flex>{props.start} </Flex>
      </Flex>
      {props.runStatus === 'paused' ? (
        <Flex flexDirection={DIRECTION_ROW}>
          <Flex marginRight={SPACING_1}>{t('current_step_pause_timer')}</Flex>
          <Flex>{props.timer} </Flex>
        </Flex>
      ) : null}
      <Flex flexDirection={DIRECTION_ROW}>
        <Flex marginRight={SPACING_1}>{t('end_step_time')}</Flex>
        <Flex marginLeft={SPACING_2}>{props.end} </Flex>
      </Flex>
    </Flex>
  )
}
