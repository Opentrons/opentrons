import * as React from 'react'
import { useTranslation } from 'react-i18next'
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

import { useRunControls, useRunStatus } from './hooks'
import { Timer } from './Timer'

export function RunTimeControl(): JSX.Element {
  const { t } = useTranslation('run_details')
  const runStatus = useRunStatus()
  const { play, pause, reset } = useRunControls()

  let callToAction: React.ReactNode = ''
  let action = (): void => {}
  if (runStatus === 'loaded') {
    callToAction = (
      <>
        <Icon name="play" size={SIZE_1} marginRight={SPACING_2} />
        <Text fontSize={FONT_SIZE_DEFAULT}>{t('start_run')}</Text>
      </>
    )
    action = play
  } else if (runStatus === 'running') {
    callToAction = (
      <>
        <Icon name="pause" size={SIZE_1} marginRight={SPACING_2} />
        <Text fontSize={FONT_SIZE_DEFAULT}>{t('pause_run')}</Text>
      </>
    )
    action = pause
  } else if (runStatus === 'paused') {
    callToAction = (
      <>
        <Icon name="play" size={SIZE_1} marginRight={SPACING_2} />
        <Text fontSize={FONT_SIZE_DEFAULT}>{t('resume_run')}</Text>
      </>
    )
    action = play
  } else if (runStatus === 'finished') {
    callToAction = <Text fontSize={FONT_SIZE_DEFAULT}>{t('run_again')}</Text>
    action = reset
  } else if (runStatus === 'canceled') {
    callToAction = <Text fontSize={FONT_SIZE_DEFAULT}>{t('run_again')}</Text>
    action = reset
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} margin={SPACING_2}>
      <Text css={FONT_HEADER_DARK} marginBottom={SPACING_3}>
        {t('run_protocol')}
      </Text>
      <Text css={FONT_BODY_1_DARK_SEMIBOLD} marginBottom={SPACING_3}>
        {t('run_status', { status: t(`status_${runStatus}`) })}
      </Text>
      {runStatus !== 'loaded' ? <Timer /> : null}
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
  )
}
