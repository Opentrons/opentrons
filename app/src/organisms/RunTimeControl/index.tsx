import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_PAUSED,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
} from '@opentrons/api-client'
import {
  Flex,
  Icon,
  IconName,
  NewPrimaryBtn,
  Text,
  Tooltip,
  useHoverTooltip,
  ALIGN_CENTER,
  ALIGN_STRETCH,
  BORDER_RADIUS_1,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  FONT_BODY_1_DARK_SEMIBOLD,
  FONT_HEADER_DARK,
  FONT_SIZE_DEFAULT,
  JUSTIFY_CENTER,
  SIZE_1,
  SPACING_2,
  SPACING_3,
  AlertItem,
} from '@opentrons/components'
import {
  useModuleMatchResults,
  useProtocolCalibrationStatus,
} from '../ProtocolSetup/RunSetupCard/hooks'
import {
  useCurrentRunControls,
  useRunStartTime,
  useCurrentRunStatus,
} from './hooks'
import { Timer } from './Timer'

export function RunTimeControl(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const missingModuleIds = useModuleMatchResults().missingModuleIds
  const isEverythingCalibrated = useProtocolCalibrationStatus().complete
  const [targetProps, tooltipProps] = useHoverTooltip()
  const runStatus = useCurrentRunStatus()
  const startTime = useRunStartTime()

  const {
    play,
    pause,
    reset,
    isPlayRunActionLoading,
    isPauseRunActionLoading,
    isResetRunLoading,
  } = useCurrentRunControls()

  const isMutationLoading =
    isPlayRunActionLoading || isPauseRunActionLoading || isResetRunLoading

  let handleButtonClick = (): void => {}
  let buttonIconName: IconName | null = null
  let buttonText: string = ''

  switch (runStatus) {
    case RUN_STATUS_IDLE:
    case RUN_STATUS_PAUSED:
    case RUN_STATUS_PAUSE_REQUESTED:
    case RUN_STATUS_BLOCKED_BY_OPEN_DOOR:
      buttonIconName = 'play'
      buttonText =
        runStatus === RUN_STATUS_IDLE ? t('start_run') : t('resume_run')
      handleButtonClick = play
      break
    case RUN_STATUS_RUNNING:
      buttonIconName = 'pause'
      buttonText = t('pause_run')
      handleButtonClick = pause
      break
    case RUN_STATUS_STOP_REQUESTED:
      buttonIconName = null
      buttonText = t('canceling_run')
      handleButtonClick = reset
      break
    case RUN_STATUS_STOPPED:
    case RUN_STATUS_FINISHING:
    case RUN_STATUS_FAILED:
    case RUN_STATUS_SUCCEEDED:
      buttonIconName = null
      buttonText = t('run_again')
      handleButtonClick = reset
      break
  }

  let disableReason = null
  if (!isEverythingCalibrated) {
    disableReason = t('run_cta_disabled')
  } else if (missingModuleIds.length > 0) {
    disableReason = t('run_cta_disabled')
  } else if (runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR) {
    disableReason = t('close_door_to_resume')
  }

  const showSpinner =
    isMutationLoading ||
    runStatus === RUN_STATUS_FINISHING ||
    runStatus === RUN_STATUS_PAUSE_REQUESTED ||
    runStatus === RUN_STATUS_STOP_REQUESTED

  const buttonIcon =
    buttonIconName != null ? (
      <Icon name={buttonIconName} size={SIZE_1} marginRight={SPACING_2} />
    ) : null

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
      {startTime != null ? (
        <Timer startTime={startTime} runStatus={runStatus} />
      ) : null}
      {runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR ? (
        <Flex marginBottom={SPACING_3}>
          <AlertItem type="warning" title={t('close_door_to_resume')} />
        </Flex>
      ) : null}

      <NewPrimaryBtn
        onClick={handleButtonClick}
        alignSelf={ALIGN_STRETCH}
        borderRadius={BORDER_RADIUS_1}
        paddingTop={SPACING_2}
        paddingBottom={SPACING_2}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        display={DISPLAY_FLEX}
        disabled={showSpinner || disableReason != null}
        {...targetProps}
      >
        {showSpinner ? (
          <Icon name="ot-spinner" size={SIZE_1} marginRight={SPACING_2} spin />
        ) : (
          buttonIcon
        )}
        <Text fontSize={FONT_SIZE_DEFAULT}>{buttonText}</Text>
      </NewPrimaryBtn>
      {disableReason != null && (
        <Tooltip {...tooltipProps}>{disableReason}</Tooltip>
      )}
    </Flex>
  ) : null
}
