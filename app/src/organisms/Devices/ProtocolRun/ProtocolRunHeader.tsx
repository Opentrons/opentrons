import * as React from 'react'
import last from 'lodash/last'
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
  useRunQuery,
  useModulesQuery,
  usePipettesQuery,
} from '@opentrons/react-api-client'
import { HEATERSHAKER_MODULE_TYPE, RunTimeCommand } from '@opentrons/shared-data'
import {
  Box,
  Flex,
  Icon,
  IconName,
  useHoverTooltip,
  useInterval,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
  BORDERS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  useConditionalConfirm,
  SPACING_AUTO,
} from '@opentrons/components'

import { getBuildrootUpdateDisplayInfo } from '../../../redux/buildroot'
import { ProtocolAnalysisErrorBanner } from './ProtocolAnalysisErrorBanner'
import { ProtocolAnalysisErrorModal } from './ProtocolAnalysisErrorModal'
import { Banner } from '../../../atoms/Banner'
import { PrimaryButton, SecondaryButton } from '../../../atoms/buttons'
import { useTrackEvent } from '../../../redux/analytics'
import { getIsHeaterShakerAttached } from '../../../redux/config'
import { StyledText } from '../../../atoms/text'
import { Tooltip } from '../../../atoms/Tooltip'
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
import { useMostRecentCompletedAnalysis } from '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useIsHeaterShakerInProtocol } from '../../ModuleCard/hooks'
import { ConfirmAttachmentModal } from '../../ModuleCard/ConfirmAttachmentModal'
import {
  useProtocolDetailsForRun,
  useProtocolAnalysisErrors,
  useRunCalibrationStatus,
  useRunCreatedAtTimestamp,
  useUnmatchedModulesForProtocol,
  useIsRobotViewable,
  useTrackProtocolRunEvent,
  useRobotAnalyticsData,
} from '../hooks'
import { formatTimestamp } from '../utils'
import { EMPTY_TIMESTAMP } from '../constants'

import type { Run } from '@opentrons/api-client'
import type { State } from '../../../redux/types'
import type { HeaterShakerModule } from '../../../redux/modules/types'
import { head } from 'lodash'
import { Portal } from '../../../App/portal'
import { single } from 'rxjs/operators'

const EQUIPMENT_POLL_MS = 5000

interface ProtocolRunHeaderProps {
  protocolRunHeaderRef: React.RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
  makeHandleJumpToStep: (index: number) => () => void
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
    startedAt != null ? formatInterval(startedAt, endTime) : EMPTY_TIMESTAMP

  return <StyledText css={TYPOGRAPHY.pRegular}>{runTime}</StyledText>
}

const MIN_AGGREGATION_PERCENT = 8
const X_MARGIN_PERCENT = 0.5
const HEAD_SIZE_PERCENT = 1.5

export function ProtocolRunHeader({
  protocolRunHeaderRef,
  robotName,
  runId,
  makeHandleJumpToStep,
}: ProtocolRunHeaderProps): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const history = useHistory()
  const [targetProps, tooltipProps] = useHoverTooltip()
  const trackEvent = useTrackEvent()
  const isHeaterShakerInProtocol = useIsHeaterShakerInProtocol()
  const configHasHeaterShakerAttached = useSelector(getIsHeaterShakerAttached)
  const createdAtTimestamp = useRunCreatedAtTimestamp(runId)
  const {
    protocolData,
    displayName,
    protocolKey,
    isProtocolAnalyzing,
  } = useProtocolDetailsForRun(runId)
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId)
  const robotAnalyticsData = useRobotAnalyticsData(robotName)
  const isRobotViewable = useIsRobotViewable(robotName)
  const runStatus = useRunStatus(runId)
  const { analysisErrors } = useProtocolAnalysisErrors(runId)
  const isRunCurrent = Boolean(useRunQuery(runId)?.data?.data?.current)
  const { closeCurrentRun, isClosingCurrentRun } = useCloseCurrentRun()
  const attachedModules =
    useModulesQuery({ refetchInterval: EQUIPMENT_POLL_MS })?.data?.data ?? []
  // NOTE: we are polling pipettes, though not using their value directly here
  usePipettesQuery({ refetchInterval: EQUIPMENT_POLL_MS })
  const { startedAt, stoppedAt, completedAt } = useRunTimestamps(runId)

  const [selectedCommandType, setSelectedCommandType] = React.useState('')
  const robotSideAnalysis = useMostRecentCompletedAnalysis(runId)
  const analysisCommands = robotSideAnalysis?.commands ?? []
  const uniqCommandTypes = analysisCommands.reduce<Array<RunTimeCommand['commandType']>>(
    (acc, c) => {
      if (acc.includes(c.commandType)) {
        return acc
      } else {
        return [...acc, c.commandType]
      }
    },
    []
  )
  const commandBufferCount = analysisCommands.length * 0.01 * MIN_AGGREGATION_PERCENT
  const ticks = analysisCommands.reduce<Array<{ index: number, count: number }>>((acc, c, index) => {
    if (selectedCommandType === c.commandType) {
      const mostRecentTick = last(acc)
      if (mostRecentTick == null) {
        return [...acc, { index, count: 1 }]
      } else if ((index - mostRecentTick.index) > commandBufferCount) {
        return [...acc, { index, count: 1 }]
      } else {
        return [...acc.slice(0, -1), { index: mostRecentTick.index, count: mostRecentTick.count + 1 }]
      }
    }
    return acc
  }, [])

  React.useEffect(() => {
    if (protocolData != null && !isRobotViewable) {
      history.push(`/devices`)
    }
  }, [protocolData, isRobotViewable, history])

  React.useEffect(() => {
    if (runStatus === RUN_STATUS_STOPPED && isRunCurrent) {
      if (runId != null) {
        trackProtocolRunEvent({
          name: 'runFinish',
          properties: {
            ...robotAnalyticsData,
          },
        })

        closeCurrentRun()
      }
    }
  }, [runStatus, isRunCurrent, runId, closeCurrentRun])

  const startedAtTimestamp =
    startedAt != null ? formatTimestamp(startedAt) : EMPTY_TIMESTAMP

  const completedAtTimestamp =
    completedAt != null ? formatTimestamp(completedAt) : EMPTY_TIMESTAMP

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
  const activeHeaterShaker = attachedModules.find(
    (module): module is HeaterShakerModule =>
      module.moduleType === HEATERSHAKER_MODULE_TYPE &&
      module?.data != null &&
      module.data.speedStatus !== 'idle'
  )
  const isShaking = attachedModules
    .filter(
      (module): module is HeaterShakerModule =>
        module.moduleType === HEATERSHAKER_MODULE_TYPE
    )
    .some(module => module?.data != null && module.data.speedStatus !== 'idle')

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

  const isIdle = runStatus === RUN_STATUS_IDLE

  const handlePlayButtonClick = (): void => {
    if (isShaking && isHeaterShakerInProtocol) {
      setShowIsShakingModal(true)
    } else if (
      isHeaterShakerInProtocol &&
      !isShaking &&
      (isIdle || runStatus === RUN_STATUS_STOPPED)
    ) {
      confirmAttachment()
    } else {
      play()

      const eventProperties =
        isIdle && robotAnalyticsData != null ? robotAnalyticsData : {}
      const eventName = isIdle ? 'runStart' : 'runResume'

      trackProtocolRunEvent({
        name: eventName,
        properties: eventProperties,
      })
    }
  }

  const handlePauseButtonClick = (): void => {
    pause()

    trackProtocolRunEvent({ name: 'runPause' })
  }

  const handleResetButtonClick = (): void => {
    reset()

    trackEvent({
      name: 'proceedToRun',
      properties: { sourceLocation: 'RunRecordDetail' },
    })
    trackProtocolRunEvent({ name: 'runAgain' })
  }

  const isRobotOnWrongVersionOfSoftware = ['upgrade', 'downgrade'].includes(
    useSelector((state: State) => {
      return getBuildrootUpdateDisplayInfo(state, robotName)
    })?.autoUpdateAction
  )
  const isRunControlButtonDisabled =
    (isCurrentRun && !isSetupComplete) ||
    isMutationLoading ||
    isRobotBusy ||
    isProtocolAnalyzing ||
    protocolData == null ||
    runStatus === RUN_STATUS_FINISHING ||
    runStatus === RUN_STATUS_PAUSE_REQUESTED ||
    runStatus === RUN_STATUS_STOP_REQUESTED ||
    runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR ||
    isRobotOnWrongVersionOfSoftware

  let handleButtonClick = (): void => { }
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
  } else if (isRobotOnWrongVersionOfSoftware) {
    disableReason = t('shared:a_software_update_is_available')
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

  const handleClearClick = (): void => {
    trackProtocolRunEvent({
      name: 'runFinish',
      properties: {
        ...robotAnalyticsData,
      },
    })

    closeCurrentRun()
  }

  let clearProtocolBanner: JSX.Element | null
  switch (runStatus) {
    case RUN_STATUS_FAILED: {
      clearProtocolBanner = (
        <Banner
          type="error"
          onCloseClick={handleClearClick}
          isCloseActionLoading={isClosingCurrentRun}
        >
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
            {`${t('run_failed')}.`}
          </Flex>
        </Banner>
      )
      break
    }
    case RUN_STATUS_SUCCEEDED: {
      clearProtocolBanner = (
        <Banner
          type="success"
          onCloseClick={handleClearClick}
          isCloseActionLoading={isClosingCurrentRun}
        >
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
            {`${t('run_completed')}.`}
          </Flex>
        </Banner>
      )
      break
    }
    default:
      clearProtocolBanner = null
  }

  const protocolRunningContent: JSX.Element | null =
    runStatus != null ? (
      <Box
        backgroundColor={COLORS.fundamentalsBackground}
        display="grid"
        gridTemplateColumns="4fr 6fr 4fr"
        padding={SPACING.spacing3}
      >
        <Box>
          <StyledText
            textTransform={TYPOGRAPHY.textTransformUppercase}
            color={COLORS.darkGreyEnabled}
            css={TYPOGRAPHY.h6Default}
            paddingBottom={SPACING.spacing2}
          >
            {t('protocol_start')}
          </StyledText>
          <StyledText
            css={TYPOGRAPHY.pRegular}
            id="ProtocolRunHeader_protocolStart"
          >
            {startedAtTimestamp}
          </StyledText>
        </Box>
        <Box>
          <StyledText
            textTransform={TYPOGRAPHY.textTransformUppercase}
            color={COLORS.darkGreyEnabled}
            css={TYPOGRAPHY.h6Default}
            paddingBottom={SPACING.spacing2}
          >
            {t('protocol_end')}
          </StyledText>
          <StyledText
            css={TYPOGRAPHY.pRegular}
            id="ProtocolRunHeader_protocolEnd"
          >
            {completedAtTimestamp}
          </StyledText>
        </Box>
        <Box marginLeft={SPACING_AUTO}>
          {showCancelButton && (
            <SecondaryButton
              style={{
                color: `${String(COLORS.errorText)}`,
                backgroundColor: 'none',
                borderColor: `${String(COLORS.errorEnabled)}`,
              }}
              padding={`${String(SPACING.spacingSM)} ${String(
                SPACING.spacing4
              )}`}
              onClick={handleCancelClick}
              id="ProtocolRunHeader_cancelRunButton"
              disabled={isClosingCurrentRun}
            >
              {t('cancel_run')}
            </SecondaryButton>
          )}
        </Box>
      </Box>
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
              color={COLORS.blueEnabled}
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
      {analysisErrors != null && analysisErrors?.length > 0 && (
        <ProtocolAnalysisErrorBanner errors={analysisErrors} />
      )}
      {runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR ? (
        <Banner type="warning">{t('close_door_to_resume')}</Banner>
      ) : null}
      {runStatus === RUN_STATUS_STOPPED ? (
        <Banner type="warning">{`${t('run_canceled')}.`}</Banner>
      ) : null}
      {isCurrentRun ? clearProtocolBanner : null}
      <Box display="grid" gridTemplateColumns="3fr 3fr 3fr 3fr 3fr">
        <Box>
          <StyledText
            textTransform={TYPOGRAPHY.textTransformUppercase}
            color={COLORS.darkGreyEnabled}
            css={TYPOGRAPHY.h6Default}
            paddingBottom={SPACING.spacing2}
          >
            {t('run')}
          </StyledText>
          {/* this is the createdAt timestamp, not the run id */}
          <StyledText
            css={TYPOGRAPHY.pRegular}
            id="ProtocolRunHeader_runRecordId"
          >
            {createdAtTimestamp}
          </StyledText>
        </Box>
        <Box>
          <StyledText
            textTransform={TYPOGRAPHY.textTransformUppercase}
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
                color={COLORS.blueEnabled}
                size={SPACING.spacing2}
                marginRight={SPACING.spacing2}
                data-testid="running_circle"
              >
                <animate
                  attributeName="fill"
                  values={`${String(COLORS.blueEnabled)}; transparent`}
                  dur="1s"
                  calcMode="discrete"
                  repeatCount="indefinite"
                  data-testid="pulsing_status_circle"
                />
              </Icon>
            ) : null}
            <StyledText
              css={TYPOGRAPHY.pRegular}
              id="ProtocolRunHeader_runStatus"
            >
              {runStatus != null ? t(`status_${String(runStatus)}`) : ''}
            </StyledText>
          </Flex>
        </Box>
        <Box>
          <StyledText
            textTransform={TYPOGRAPHY.textTransformUppercase}
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
        <select onChange={(e) => setSelectedCommandType(e.target.value)}>
          {uniqCommandTypes.map(cT => <option value={cT}>{cT}</option>)}
        </select>
        {showIsShakingModal &&
          activeHeaterShaker != null &&
          isHeaterShakerInProtocol &&
          runId != null && (
            <HeaterShakerIsRunningModal
              closeModal={() => setShowIsShakingModal(false)}
              module={activeHeaterShaker}
              startRun={play}
            />
          )}
        <Box marginLeft={SPACING_AUTO}>
          <PrimaryButton
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
            boxShadow="none"
            display={DISPLAY_FLEX}
            padding={`${String(SPACING.spacingSM)} ${String(SPACING.spacing4)}`}
            disabled={isRunControlButtonDisabled}
            onClick={handleButtonClick}
            id="ProtocolRunHeader_runControlButton"
            {...targetProps}
          >
            {buttonIcon}
            <StyledText css={TYPOGRAPHY.pSemiBold}>{buttonText}</StyledText>
          </PrimaryButton>
          {disableReason != null && (
            <Tooltip tooltipProps={tooltipProps}>{disableReason}</Tooltip>
          )}
        </Box>
      </Box>
      {/* {protocolRunningContent} */}
      <ProgressMeter {...{ ticks, makeHandleJumpToStep, analysisCommands }} currentRunCommandIndex={1100} />
      {showConfirmCancelModal ? (
        <ConfirmCancelModal
          onClose={() => setShowConfirmCancelModal(false)}
          runId={runId}
        />
      ) : null}
    </Flex>
  )
}

interface ProgressMeterProps {
  analysisCommands: RunTimeCommand[]
  ticks: Array<{ index: number, count: number }>
  makeHandleJumpToStep: (i: number) => () => void
  currentRunCommandIndex: number
}
function ProgressMeter(props: ProgressMeterProps) {
  const { ticks, analysisCommands, makeHandleJumpToStep, currentRunCommandIndex } = props
  const innerXMargin = analysisCommands.length * 0.01 * X_MARGIN_PERCENT
  const headSize = analysisCommands.length * 0.01 * HEAD_SIZE_PERCENT
  return (
    <svg width="100%" height="40px" viewBox={`${-1 * innerXMargin} 0 ${analysisCommands.length + innerXMargin} ${headSize * 2}`}>
      <rect stroke={COLORS.blueEnabled} fill="#fff" x="0" y={headSize * 3 / 4} height={headSize / 2} width={analysisCommands.length} />
      <rect fill={COLORS.blueEnabled} x="0" y={headSize * 3 / 4} height={headSize / 2} width={currentRunCommandIndex} />
      {ticks.map((tick) => (
        <Tick {...{ ...tick, makeHandleJumpToStep, headSize }} />
      ))}
    </svg>
  )
}

function Tick(props: { index: number, count: number, makeHandleJumpToStep: (i: number) => () => void, headSize: number }) {
  const { index, count, makeHandleJumpToStep, headSize } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  const isAggregatedTick = count > 1
  const height = headSize * 2
  const singleWidth = height/4
  const aggregateWidth= height*3/4
  const strokeWidth = height / 20
  return (
    <>
      <g {...targetProps} onClick={makeHandleJumpToStep(index)}>
        {isAggregatedTick
          ? <>
            <rect x={index + (headSize * 3 / 8)} y='0' height={height} width={aggregateWidth} fill="#fff" stroke={COLORS.blueEnabled} strokeWidth={strokeWidth} ry={height/4} rx={aggregateWidth/2} />
            <text x={index + (aggregateWidth*(count >=10 ? 3/8 : 9/16))} y={height*5/8} color="black" fontSize={headSize}>{count}</text>
          </>
          : <rect x={index + (headSize * 3 / 8)} y='0' height={height} width={singleWidth} fill="#fff" stroke={COLORS.blueEnabled} strokeWidth={strokeWidth} ry={singleWidth/2} rx={singleWidth/2} />
        }
      </g>
      {isAggregatedTick
        ? <Portal level="top"><Tooltip {...tooltipProps}>{count}</Tooltip> </Portal>
        : null}
    </>
  )
}