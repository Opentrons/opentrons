import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  // RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_PAUSED,
  // RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import {
  Flex,
  Icon,
  PrimaryBtn,
  Text,
  ALIGN_CENTER,
  ALIGN_STRETCH,
  BORDER_RADIUS_1,
  C_BLUE,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  FONT_BODY_1_DARK_SEMIBOLD,
  FONT_HEADER_DARK,
  FONT_SIZE_DEFAULT,
  JUSTIFY_CENTER,
  SIZE_1,
  SPACING_2,
  SPACING_3,
} from '@opentrons/components'

import {
  useRunControls,
  useRunPauseTime,
  useRunStartTime,
  useRunStatus,
} from './hooks'
import { Timer } from './Timer'

export function RunTimeControl(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const runStatus = useRunStatus()
  const startTime = useRunStartTime()
  const pausedAt = useRunPauseTime()

  const { usePlay, usePause, useReset } = useRunControls()

  let callToAction: React.ReactNode = ''
  let action = (): void => {}
  if (runStatus === RUN_STATUS_IDLE) {
    callToAction = (
      <>
        <Icon name="play" size={SIZE_1} marginRight={SPACING_2} />
        <Text fontSize={FONT_SIZE_DEFAULT}>{t('start_run')}</Text>
      </>
    )
    action = usePlay
  } else if (runStatus === RUN_STATUS_RUNNING) {
    callToAction = (
      <>
        <Icon name="pause" size={SIZE_1} marginRight={SPACING_2} />
        <Text fontSize={FONT_SIZE_DEFAULT}>{t('pause_run')}</Text>
      </>
    )
    action = usePause
  } else if (runStatus === RUN_STATUS_PAUSED) {
    callToAction = (
      <>
        <Icon name="play" size={SIZE_1} marginRight={SPACING_2} />
        <Text fontSize={FONT_SIZE_DEFAULT}>{t('resume_run')}</Text>
      </>
    )
    action = usePlay
    // TODO: need status stop-requested, pause-requested
  } else if (
    runStatus === RUN_STATUS_STOPPED ||
    runStatus === RUN_STATUS_FAILED ||
    runStatus === RUN_STATUS_SUCCEEDED
  ) {
    callToAction = <Text fontSize={FONT_SIZE_DEFAULT}>{t('run_again')}</Text>
    action = useReset
  }

  return runStatus != null ? (
    <Flex flexDirection={DIRECTION_COLUMN} margin={SPACING_2}>
      <Text css={FONT_HEADER_DARK} marginBottom={SPACING_3}>
        {t('run_protocol')}
      </Text>
      <Text css={FONT_BODY_1_DARK_SEMIBOLD} marginBottom={SPACING_3}>
        {runStatus != null
          ? t('run_status', { status: t(`status_${runStatus}`) })
          : ''}
      </Text>
      {runStatus !== RUN_STATUS_IDLE &&
      runStatus != null &&
      startTime != null ? (
        <Timer startTime={startTime} pausedAt={pausedAt} />
      ) : null}
      <PrimaryBtn
        onClick={action}
        alignSelf={ALIGN_STRETCH}
        backgroundColor={C_BLUE}
        borderRadius={BORDER_RADIUS_1}
        paddingTop={SPACING_2}
        paddingBottom={SPACING_2}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        display={DISPLAY_FLEX}
      >
        {callToAction}
      </PrimaryBtn>
    </Flex>
  ) : null
}
