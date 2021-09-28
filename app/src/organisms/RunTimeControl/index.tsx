import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_STRETCH,
  DIRECTION_COLUMN,
  Flex,
  PrimaryBtn,
  SPACING_1,
  Text,
} from '@opentrons/components'
import { useRunControls, useRunDisabledReason, useRunStatus } from './hooks'

export function RunTimeControl(): JSX.Element {
  const { t } = useTranslation('run_details')
  const runStatus = useRunStatus()
  const { play, pause, reset } = useRunControls()

  let callToActionText = ''
  let action = () => {}
  if (runStatus === 'loaded') {
    callToActionText = t('start_run')
    action = play
  } else if (runStatus === 'running') {
    callToActionText = t('pause_run')
    action = pause
  } else if (runStatus === 'paused') {
    callToActionText = t('resume_run')
    action = play
  } else if (runStatus === 'finished') {
    callToActionText = t('reset_run')
    action = reset
  } else if (runStatus === 'canceled') {
    callToActionText = t('reset_run')
    action = reset
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} margin={SPACING_1}>
      <Text>{t('run_status', { status: t(`status_${runStatus}`) })}</Text>
      {runStatus !== 'loaded' ? <Text>TODO: INSERT RUN TIMER HERE</Text> : null}
      <PrimaryBtn onClick={action} alignSelf={ALIGN_STRETCH}>
        {callToActionText}
      </PrimaryBtn>
    </Flex>
  )
}
