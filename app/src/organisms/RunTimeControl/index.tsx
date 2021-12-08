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
  RUN_STATUS_SUCCEEDED,
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
} from '@opentrons/components'
import {
  useMissingModuleIds,
  useProtocolCalibrationStatus,
} from '../ProtocolSetup/RunSetupCard/hooks'
import {
  useRunCompleteTime,
  useRunControls,
  useRunPauseTime,
  useRunStartTime,
  useRunStatus,
} from './hooks'
import { Timer } from './Timer'

export function RunTimeControl(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const missingModuleIds = useMissingModuleIds()
  const isEverythingCalibrated = useProtocolCalibrationStatus().complete
  const disableRunCta = !isEverythingCalibrated || missingModuleIds.length > 0
  const [targetProps, tooltipProps] = useHoverTooltip()
  const runStatus = useRunStatus()
  const startTime = useRunStartTime()
  const pausedAt = useRunPauseTime()
  const completedAt = useRunCompleteTime()

  const {
    play,
    pause,
    reset,
    isPlayRunActionLoading,
    isPauseRunActionLoading,
    isResetRunLoading,
  } = useRunControls()

  const [isRunActionLoading, setIsRunActionLoading] = React.useState(false)
  const [lastRunAction, setLastRunAction] = React.useState<
    'play' | 'pause' | 'reset' | null
  >(null)

  React.useEffect(() => {
    if (isPlayRunActionLoading) {
      setIsRunActionLoading(true)
      setLastRunAction('play')
    } else if (isPauseRunActionLoading) {
      setIsRunActionLoading(true)
      setLastRunAction('pause')
    } else if (isResetRunLoading) {
      setIsRunActionLoading(true)
      setLastRunAction('reset')
    }

    if (isRunActionLoading) {
      if (lastRunAction === 'play' && runStatus === RUN_STATUS_RUNNING) {
        setIsRunActionLoading(false)
      }
      if (
        lastRunAction === 'pause' &&
        (runStatus === RUN_STATUS_PAUSED ||
          runStatus === RUN_STATUS_PAUSE_REQUESTED)
      ) {
        setIsRunActionLoading(false)
      }
      if (lastRunAction === 'reset' && runStatus === RUN_STATUS_IDLE) {
        setIsRunActionLoading(false)
      }
    }
  }, [
    isPlayRunActionLoading,
    isPauseRunActionLoading,
    isResetRunLoading,
    isRunActionLoading,
    lastRunAction,
    runStatus,
  ])

  let handleButtonClick = (): void => {}
  let buttonIconName: IconName | null = null
  let buttonText: string = ''

  if (runStatus === RUN_STATUS_IDLE) {
    buttonIconName = 'play'
    buttonText = t('start_run')
    handleButtonClick = play
  } else if (runStatus === RUN_STATUS_RUNNING) {
    buttonIconName = 'pause'
    buttonText = t('pause_run')
    handleButtonClick = pause
  } else if (
    runStatus === RUN_STATUS_PAUSED ||
    runStatus === RUN_STATUS_PAUSE_REQUESTED
  ) {
    buttonIconName = 'play'
    buttonText = t('resume_run')
    handleButtonClick = play
  } else if (
    runStatus === RUN_STATUS_STOP_REQUESTED ||
    runStatus === RUN_STATUS_STOPPED ||
    runStatus === RUN_STATUS_FAILED ||
    runStatus === RUN_STATUS_SUCCEEDED
  ) {
    buttonIconName = null
    buttonText = t('run_again')
    handleButtonClick = reset
  }

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
        <Timer
          startTime={startTime}
          pausedAt={pausedAt}
          completedAt={completedAt}
        />
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
        disabled={disableRunCta || isRunActionLoading}
        {...targetProps}
      >
        {isRunActionLoading ? (
          <Icon name="ot-spinner" size={SIZE_1} marginRight={SPACING_2} spin />
        ) : (
          buttonIcon
        )}
        <Text fontSize={FONT_SIZE_DEFAULT}>{buttonText}</Text>
      </NewPrimaryBtn>
      {disableRunCta && (
        <Tooltip {...tooltipProps}>{t('run_cta_disabled')}</Tooltip>
      )}
    </Flex>
  ) : null
}
