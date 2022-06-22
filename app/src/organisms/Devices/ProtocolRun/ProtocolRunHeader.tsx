import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'

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
  useDismissCurrentRunMutation,
  useRunQuery,
  useModulesQuery,
  usePipettesQuery,
} from '@opentrons/react-api-client'
import { HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'
import {
  Box,
  Flex,
  Icon,
  IconName,
  Tooltip,
  useHoverTooltip,
  useInterval,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  DIRECTION_ROW,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
  SIZE_3,
  SIZE_4,
  SIZE_5,
  TEXT_TRANSFORM_UPPERCASE,
  BORDERS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  useConditionalConfirm,
} from '@opentrons/components'

import { ProtocolAnalysisErrorBanner } from './ProtocolAnalysisErrorBanner'
import { ProtocolAnalysisErrorModal } from './ProtocolAnalysisErrorModal'
import { Banner } from '../../../atoms/Banner'
import { PrimaryButton, SecondaryButton } from '../../../atoms/buttons'
import { useTrackEvent } from '../../../redux/analytics'
import { getIsHeaterShakerAttached } from '../../../redux/config'
import { StyledText } from '../../../atoms/text'
import {
  useCloseCurrentRun,
  useCurrentRunId,
} from '../../../organisms/ProtocolUpload/hooks'
import { ConfirmCancelModal } from '../../../organisms/RunDetails/ConfirmCancelModal'
import { HeaterShakerIsRunningModal } from '../HeaterShakerIsRunningModal'
import {
  useRunControls,
  useRunStatus,
  useRunTimestamps,
} from '../../../organisms/RunTimeControl/hooks'
import { formatInterval } from '../../../organisms/RunTimeControl/utils'
import { useIsHeaterShakerInProtocol } from '../../ModuleCard/hooks'
import { ConfirmAttachmentModal } from '../../ModuleCard/ConfirmAttachmentModal'

import {
  useProtocolDetailsForRun,
  useProtocolAnalysisErrors,
  useRunCalibrationStatus,
  useRunCreatedAtTimestamp,
  useUnmatchedModulesForProtocol,
  useIsRobotViewable,
  useProtocolRunAnalyticsData,
  useRobotAnalyticsData,
} from '../hooks'
import { formatTimestamp } from '../utils'

import type { Run } from '@opentrons/api-client'
import type { HeaterShakerModule } from '../../../redux/modules/types'

const EQUIPMENT_POLL_MS = 5000

interface ProtocolRunHeaderProps {
  protocolRunHeaderRef: React.RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
}

function RunTimer({
  runStatus,
  startedAt,
  stoppedAt,
  completedAt,
}: {
  runStatus: string | null
  startedAt: string | null
  stoppedAt: string | null
  completedAt: string | null
}): JSX.Element {
  const [now, setNow] = React.useState(Date())
  useInterval(() => setNow(Date()), 500, true)

  const endTime =
    runStatus === RUN_STATUS_STOP_REQUESTED && stoppedAt != null
      ? stoppedAt
      : completedAt ?? now

  const runTime =
    startedAt != null ? formatInterval(startedAt, endTime) : '--:--:--'

  return (
    <StyledText css={TYPOGRAPHY.pRegular} color={COLORS.darkBlack}>
      {runTime}
    </StyledText>
  )
}

export function ProtocolRunHeader({
  protocolRunHeaderRef,
  robotName,
  runId,
}: ProtocolRunHeaderProps): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const history = useHistory()
  const [targetProps, tooltipProps] = useHoverTooltip()
  const trackEvent = useTrackEvent()
  const isHeaterShakerInProtocol = useIsHeaterShakerInProtocol()
  const configHasHeaterShakerAttached = useSelector(getIsHeaterShakerAttached)
  const createdAtTimestamp = useRunCreatedAtTimestamp(runId)
  const { protocolData, displayName, protocolKey } = useProtocolDetailsForRun(
    runId
  )
  const { getProtocolRunAnalyticsData } = useProtocolRunAnalyticsData(runId)
  const robotAnalyticsData = useRobotAnalyticsData(robotName)
  const isRobotViewable = useIsRobotViewable(robotName)
  const isProtocolAnalyzing = protocolData == null && isRobotViewable
  const runStatus = useRunStatus(runId)
  const { analysisErrors } = useProtocolAnalysisErrors(runId)
  const isRunCurrent = Boolean(useRunQuery(runId)?.data?.data?.current)
  const { dismissCurrentRun } = useDismissCurrentRunMutation()
  const attachedModules =
    useModulesQuery({ refetchInterval: EQUIPMENT_POLL_MS })?.data?.data ?? []
  // NOTE: we are polling pipettes, though not using their value directly here
  usePipettesQuery({ refetchInterval: EQUIPMENT_POLL_MS })
  const { startedAt, stoppedAt, completedAt } = useRunTimestamps(runId)

  React.useEffect(() => {
    if (protocolData != null && !isRobotViewable) {
      history.push(`/devices`)
    }
  }, [protocolData, isRobotViewable, history])

  React.useEffect(() => {
    const dismissRun = async (): Promise<void> => {
      const {
        protocolRunAnalyticsData,
        runTime,
      } = await getProtocolRunAnalyticsData()

      trackEvent({
        name: 'runFinish',
        properties: {
          ...robotAnalyticsData,
          ...protocolRunAnalyticsData,
          runTime,
        },
      })

      dismissCurrentRun(runId)
    }

    if (runStatus === RUN_STATUS_STOPPED && isRunCurrent) {
      runId != null && dismissRun()
    }
  }, [
    runStatus,
    isRunCurrent,
    runId,
    dismissCurrentRun,
    getProtocolRunAnalyticsData,
    robotAnalyticsData,
    trackEvent,
  ])

  const startedAtTimestamp =
    startedAt != null ? formatTimestamp(startedAt) : '--:--:--'

  const completedAtTimestamp =
    completedAt != null ? formatTimestamp(completedAt) : '--:--:--'

  // redirect to new run after successful reset
  const onResetSuccess = (createRunResponse: Run): void =>
    history.push(
      `/devices/${robotName}/protocol-runs/${createRunResponse.data.id}/run-log`
    )

  const {
    play,
    pause,
    reset,
    isPlayRunActionLoading,
    isPauseRunActionLoading,
    isResetRunLoading,
  } = useRunControls(runId, onResetSuccess)

  const isMutationLoading =
    isPlayRunActionLoading || isPauseRunActionLoading || isResetRunLoading

  const { missingModuleIds } = useUnmatchedModulesForProtocol(robotName, runId)
  const { complete: isCalibrationComplete } = useRunCalibrationStatus(
    robotName,
    runId
  )
  const isSetupComplete = isCalibrationComplete && missingModuleIds.length === 0

  const currentRunId = useCurrentRunId()
  const isRobotBusy = currentRunId != null && currentRunId !== runId
  const isCurrentRun = currentRunId === runId

  const [showIsShakingModal, setShowIsShakingModal] = React.useState<boolean>(
    false
  )
  const heaterShaker = attachedModules.find(
    (module): module is HeaterShakerModule =>
      module.moduleType === HEATERSHAKER_MODULE_TYPE
  )
  const isShaking =
    heaterShaker?.data != null && heaterShaker.data.speedStatus !== 'idle'

  const handleProceedToRunClick = (): void => {
    trackEvent({ name: 'proceedToRun', properties: {} })
    play()
  }

  const {
    confirm: confirmAttachment,
    showConfirmation: showConfirmationModal,
    cancel: cancelExit,
  } = useConditionalConfirm(
    handleProceedToRunClick,
    !configHasHeaterShakerAttached
  )

  const [showAnalysisErrorModal, setShowAnalysisErrorModal] = React.useState(
    false
  )
  const handleErrorModalCloseClick: React.MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowAnalysisErrorModal(false)
  }
  React.useEffect(() => {
    if (analysisErrors != null && analysisErrors?.length > 0) {
      setShowAnalysisErrorModal(true)
    }
  }, [analysisErrors])

  const handlePlayButtonClick = async (): Promise<void> => {
    if (isShaking) {
      setShowIsShakingModal(true)
    } else if (isHeaterShakerInProtocol && !isShaking) {
      confirmAttachment()
    } else {
      const {
        protocolRunAnalyticsData,
        runTime,
      } = await getProtocolRunAnalyticsData()
      const isIdle = runStatus === RUN_STATUS_IDLE
      const properties = isIdle
        ? { ...robotAnalyticsData, ...protocolRunAnalyticsData }
        : { ...protocolRunAnalyticsData, runTime }

      trackEvent({
        name: isIdle ? 'runStart' : 'runResume',
        properties,
      })

      play()
    }
  }

  const handlePauseButtonClick = async (): Promise<void> => {
    const {
      protocolRunAnalyticsData,
      runTime,
    } = await getProtocolRunAnalyticsData()

    trackEvent({
      name: 'runPause',
      properties: { ...protocolRunAnalyticsData, runTime },
    })

    pause()
  }

  const handleResetButtonClick = async (): Promise<void> => {
    const { protocolRunAnalyticsData } = await getProtocolRunAnalyticsData()

    trackEvent({
      name: 'runAgain',
      properties: { ...protocolRunAnalyticsData },
    })

    reset()
  }

  const isRunControlButtonDisabled =
    (isCurrentRun && !isSetupComplete) ||
    isMutationLoading ||
    isRobotBusy ||
    isProtocolAnalyzing ||
    runStatus === RUN_STATUS_FINISHING ||
    runStatus === RUN_STATUS_PAUSE_REQUESTED ||
    runStatus === RUN_STATUS_STOP_REQUESTED ||
    runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR

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
      handleButtonClick = handlePlayButtonClick
      break
    case RUN_STATUS_RUNNING:
      buttonIconName = 'pause'
      buttonText = t('pause_run')
      handleButtonClick = handlePauseButtonClick
      break
    case RUN_STATUS_STOP_REQUESTED:
      buttonIconName = null
      buttonText = t('canceling_run')
      handleButtonClick = handleResetButtonClick
      break
    case RUN_STATUS_STOPPED:
    case RUN_STATUS_FINISHING:
    case RUN_STATUS_FAILED:
    case RUN_STATUS_SUCCEEDED:
      buttonIconName = 'play'
      buttonText = t('run_again')
      handleButtonClick = handleResetButtonClick
      break
  }

  if (isProtocolAnalyzing) {
    buttonIconName = 'ot-spinner'
    buttonText = t('analyzing_on_robot')
  }

  let disableReason = null
  if (isCurrentRun && !isSetupComplete) {
    disableReason = t('setup_incomplete')
  } else if (isRobotBusy) {
    disableReason = t('robot_is_busy')
  }

  const buttonIcon =
    buttonIconName != null ? (
      <Icon
        name={buttonIconName}
        size={SIZE_1}
        marginRight={SPACING.spacing3}
        spin={isProtocolAnalyzing}
      />
    ) : null

  const [
    showConfirmCancelModal,
    setShowConfirmCancelModal,
  ] = React.useState<boolean>(false)

  const handleCancelClick = (): void => {
    if (runStatus === RUN_STATUS_RUNNING) pause()
    setShowConfirmCancelModal(true)
  }

  const showCancelButton =
    runStatus === RUN_STATUS_RUNNING ||
    runStatus === RUN_STATUS_PAUSED ||
    runStatus === RUN_STATUS_PAUSE_REQUESTED ||
    runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR ||
    runStatus === RUN_STATUS_IDLE

  const { closeCurrentRun, isClosingCurrentRun } = useCloseCurrentRun()

  const handleClearClick = (): void => {
    closeCurrentRun()
  }

  const ClearProtocolBanner = (): JSX.Element | null => {
    switch (runStatus) {
      case RUN_STATUS_FAILED: {
        return (
          <Banner type="error" onCloseClick={handleClearClick}>
            <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
              {`${t('run_failed')}.`}
            </Flex>
          </Banner>
        )
      }
      case RUN_STATUS_SUCCEEDED: {
        return (
          <Banner type="success" onCloseClick={handleClearClick}>
            <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
              {`${t('run_completed')}.`}
            </Flex>
          </Banner>
        )
      }
    }
    return null
  }

  const ProtocolRunningContent = (): JSX.Element | null =>
    runStatus != null ? (
      <Flex
        backgroundColor={COLORS.lightGrey}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        padding={SPACING.spacing3}
      >
        <Flex gridGap={SPACING.spacing6}>
          <Box>
            <StyledText
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              color={COLORS.darkGreyEnabled}
              css={TYPOGRAPHY.h6Default}
              paddingBottom={SPACING.spacing2}
            >
              {t('protocol_start')}
            </StyledText>
            <StyledText
              css={TYPOGRAPHY.pRegular}
              color={COLORS.darkBlack}
              id="ProtocolRunHeader_protocolStart"
            >
              {startedAtTimestamp}
            </StyledText>
          </Box>
          <Box>
            <StyledText
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              color={COLORS.darkGreyEnabled}
              css={TYPOGRAPHY.h6Default}
              paddingBottom={SPACING.spacing2}
            >
              {t('protocol_end')}
            </StyledText>
            <StyledText
              css={TYPOGRAPHY.pRegular}
              color={COLORS.darkBlack}
              id="ProtocolRunHeader_protocolEnd"
            >
              {completedAtTimestamp}
            </StyledText>
          </Box>
        </Flex>
        {showCancelButton ? (
          <SecondaryButton
            color={COLORS.errorText}
            padding={`${SPACING.spacingSM} ${SPACING.spacing4}`}
            onClick={handleCancelClick}
            id="ProtocolRunHeader_cancelRunButton"
            disabled={isClosingCurrentRun}
          >
            {t('cancel_run')}
          </SecondaryButton>
        ) : null}
      </Flex>
    ) : null

  return (
    <Flex
      ref={protocolRunHeaderRef}
      backgroundColor={COLORS.white}
      border={BORDERS.lineBorder}
      borderRadius={BORDERS.radiusSoftCorners}
      color={COLORS.black}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      marginBottom={SPACING.spacing4}
      padding={SPACING.spacing4}
    >
      {showConfirmationModal && (
        <ConfirmAttachmentModal
          onCloseClick={cancelExit}
          isProceedToRunModal={true}
          onConfirmClick={handleProceedToRunClick}
        />
      )}
      {showAnalysisErrorModal &&
        analysisErrors &&
        analysisErrors?.length > 0 && (
          <ProtocolAnalysisErrorModal
            displayName={displayName}
            errors={analysisErrors}
            onClose={handleErrorModalCloseClick}
            robotName={robotName}
          />
        )}

      <Flex>
        {protocolKey != null ? (
          <Link to={`/protocols/${protocolKey}`}>
            <StyledText
              color={COLORS.blue}
              css={TYPOGRAPHY.h2SemiBold}
              id="ProtocolRunHeader_protocolName"
            >
              {displayName}
            </StyledText>
          </Link>
        ) : (
          <StyledText
            css={TYPOGRAPHY.h2SemiBold}
            id="ProtocolRunHeader_protocolName"
          >
            {displayName}
          </StyledText>
        )}
      </Flex>
      {analysisErrors && analysisErrors?.length > 0 && (
        <ProtocolAnalysisErrorBanner errors={analysisErrors} />
      )}
      {runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR ? (
        <Banner type="warning">{t('close_door_to_resume')}</Banner>
      ) : null}
      {runStatus === RUN_STATUS_STOPPED ? (
        <Banner type="warning">{`${t('run_canceled')}.`}</Banner>
      ) : null}
      {isCurrentRun ? <ClearProtocolBanner /> : null}
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Box minWidth={SIZE_4}>
          <StyledText
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            color={COLORS.darkGreyEnabled}
            css={TYPOGRAPHY.h6Default}
            paddingBottom={SPACING.spacing2}
          >
            {t('run_id')}
          </StyledText>
          {/* this is the createdAt timestamp, not the run id */}
          <StyledText
            css={TYPOGRAPHY.pRegular}
            color={COLORS.darkBlack}
            id="ProtocolRunHeader_runRecordId"
          >
            {createdAtTimestamp}
          </StyledText>
        </Box>
        <Box minWidth={SIZE_3}>
          <StyledText
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            color={COLORS.darkGreyEnabled}
            css={TYPOGRAPHY.h6Default}
            paddingBottom={SPACING.spacing2}
          >
            {t('status')}
          </StyledText>
          <Flex alignItems={ALIGN_CENTER}>
            {runStatus === RUN_STATUS_RUNNING ? (
              <Icon
                name="circle"
                color={COLORS.blue}
                size={SPACING.spacing2}
                marginRight={SPACING.spacing2}
                data-testid="running_circle"
              >
                <animate
                  attributeName="fill"
                  values={`${COLORS.blue}; transparent`}
                  dur="1s"
                  calcMode="discrete"
                  repeatCount="indefinite"
                  data-testid="pulsing_status_circle"
                />
              </Icon>
            ) : null}
            <StyledText
              css={TYPOGRAPHY.pRegular}
              color={COLORS.darkBlack}
              id="ProtocolRunHeader_runStatus"
            >
              {runStatus != null ? t(`status_${runStatus}`) : ''}
            </StyledText>
          </Flex>
        </Box>
        <Box minWidth={SIZE_3}>
          <StyledText
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            color={COLORS.darkGreyEnabled}
            css={TYPOGRAPHY.h6Default}
            paddingBottom={SPACING.spacing2}
          >
            {t('run_time')}
          </StyledText>
          <RunTimer
            runStatus={runStatus}
            startedAt={startedAt}
            stoppedAt={stoppedAt}
            completedAt={completedAt}
          />
        </Box>
        {showIsShakingModal && heaterShaker != null && (
          <HeaterShakerIsRunningModal
            closeModal={() => setShowIsShakingModal(false)}
            module={heaterShaker}
            startRun={play}
          />
        )}
        <Flex
          justifyContent={'flex-end'}
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacingSM}
          width={SIZE_5}
        >
          <PrimaryButton
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
            boxShadow="none"
            display={DISPLAY_FLEX}
            padding={`${SPACING.spacingSM} ${SPACING.spacing4}`}
            disabled={isRunControlButtonDisabled}
            onClick={handleButtonClick}
            id="ProtocolRunHeader_runControlButton"
            {...targetProps}
          >
            {buttonIcon}
            <StyledText css={TYPOGRAPHY.pSemiBold}>{buttonText}</StyledText>
          </PrimaryButton>
          {disableReason != null && (
            <Tooltip {...tooltipProps}>{disableReason}</Tooltip>
          )}
        </Flex>
      </Flex>
      <ProtocolRunningContent />
      {showConfirmCancelModal ? (
        <ConfirmCancelModal
          onClose={() => setShowConfirmCancelModal(false)}
          runId={runId}
        />
      ) : null}
    </Flex>
  )
}
