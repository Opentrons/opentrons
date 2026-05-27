import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import clsx from 'clsx'

import {
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'
import {
  getLabwareDefinitionsFromCommands,
  StepMeter,
  useSwipe,
} from '@opentrons/components'
import {
  useProtocolQuery,
  useRunActionMutations,
} from '@opentrons/react-api-client'

import { useGuardedAction } from '/app/local-resources/access-control/useGuardedAction'
import { useToastOnErrorImage } from '/app/local-resources/images/hooks/useToastOnErrorImage'
import { useIsDoorOpen } from '/app/organisms/DoorOpenControl/useIsDoorOpen'
import {
  ErrorRecoveryFlows,
  useErrorRecoveryFlows,
} from '/app/organisms/ErrorRecoveryFlows'
import {
  InterventionModal,
  useInterventionModal,
} from '/app/organisms/InterventionModal'
import { OpenDoorAlertModal } from '/app/organisms/ODD/OpenDoorAlertModal'
import {
  CurrentRunningProtocolCommand,
  ImageGalleryList,
  RunningProtocolCommandList,
  RunningProtocolSkeleton,
} from '/app/organisms/ODD/RunningProtocol'
import { CancelingRunModal } from '/app/organisms/ODD/RunningProtocol/CancelingRunModal'
import { ConfirmCancelRunModal } from '/app/organisms/ODD/RunningProtocol/ConfirmCancelRunModal'
import {
  useRobotAnalyticsData,
  useTrackProtocolRunEvent,
} from '/app/redux-resources/analytics'
import { useRobotType } from '/app/redux-resources/robots'
import { ANALYTICS_PROTOCOL_RUN_ACTION } from '/app/redux/analytics'
import { getLocalRobot } from '/app/redux/discovery'
import {
  useLastRunCommand,
  useMostRecentCompletedAnalysis,
  useNotifyRunQuery,
  useRunTimestamps,
} from '/app/resources/runs'

import styles from './runningprotocol.module.css'

import type { OnDeviceRouteParams } from '/app/App/types'
import type {
  CurrentRunningProtocolCommandProps,
  RunningProtocolCommandListProps,
} from '/app/organisms/ODD/RunningProtocol'

const LIVE_RUN_COMMANDS_POLL_MS = 3000
const RUN_STATUS_REFETCH_INTERVAL = 5000

export type ScreenOption =
  | 'CurrentRunningProtocolCommand'
  | 'RunningProtocolCommandList'
  | 'ImageGallery'

const SCREEN_ORDER: ScreenOption[] = [
  'CurrentRunningProtocolCommand',
  'RunningProtocolCommandList',
  'ImageGallery',
]

export function RunningProtocol(): JSX.Element {
  const { runId } = useParams<
    keyof OnDeviceRouteParams
  >() as OnDeviceRouteParams
  const [currentOption, setCurrentOption] = useState<ScreenOption>(
    'CurrentRunningProtocolCommand'
  )
  const [showConfirmCancelRunModal, setShowConfirmCancelRunModal] =
    useState<boolean>(false)
  const lastAnimatedCommand = useRef<string | null>(null)
  const { ref, style, swipeType, setSwipeType } = useSwipe()
  const robotSideAnalysis = useMostRecentCompletedAnalysis(runId)
  const lastRunCommand = useLastRunCommand(runId, {
    refetchInterval: LIVE_RUN_COMMANDS_POLL_MS,
  })

  const totalIndex = robotSideAnalysis?.commands.length
  const currentRunCommandIndex = robotSideAnalysis?.commands.findIndex(
    c => c.key === lastRunCommand?.key
  )

  const { startedAt, stoppedAt, completedAt } = useRunTimestamps(runId)
  const { data: runRecord } = useNotifyRunQuery(runId, {
    staleTime: Infinity,
    refetchInterval: RUN_STATUS_REFETCH_INTERVAL,
  })
  const runStatus = runRecord?.data.status ?? null

  const protocolId = runRecord?.data.protocolId ?? null
  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })

  // TODO(jj): figure out what to do with actionsToDocument
  const docstate = useGuardedAction()

  const protocolName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name
  const { playRun, pauseRun } = useRunActionMutations(runId, docstate)
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot != null ? localRobot.name : 'no name'
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const robotAnalyticsData = useRobotAnalyticsData(robotName)
  const robotType = useRobotType(robotName)
  const { isERActive, failedCommand, runLwDefsByUri } = useErrorRecoveryFlows(
    runId,
    runStatus
  )
  const doorStatus = useIsDoorOpen(robotName)
  const { showModal: showIntervention, modalProps: interventionProps } =
    useInterventionModal({
      runStatus,
      lastRunCommand,
      runData: runRecord?.data ?? null,
      robotName,
      analysis: robotSideAnalysis,
      doorIsOpen: runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
    })

  useEffect(() => {
    if (swipeType === '') {
      return
    }

    const currentIndex = SCREEN_ORDER.indexOf(currentOption)
    const maxIndex = SCREEN_ORDER.length - 1
    let newIndex: number

    if (swipeType === 'swipe-left') {
      newIndex = Math.min(currentIndex + 1, maxIndex)
    } else if (swipeType === 'swipe-right') {
      newIndex = Math.max(currentIndex - 1, 0)
    } else {
      return
    }

    if (newIndex !== currentIndex) {
      setCurrentOption(SCREEN_ORDER[newIndex])
    }
    setSwipeType('')
  }, [currentOption, swipeType, setSwipeType])

  const isValidRobotSideAnalysis = robotSideAnalysis != null
  const allRunDefs = useMemo(
    () =>
      robotSideAnalysis != null
        ? getLabwareDefinitionsFromCommands(robotSideAnalysis.commands)
        : [],
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isValidRobotSideAnalysis]
  )

  const onStop = (): void => {
    if (runStatus === RUN_STATUS_RUNNING) pauseRun()
    setShowConfirmCancelRunModal(true)
  }

  const onTogglePlayPause = (): void => {
    if (runStatus === RUN_STATUS_RUNNING) {
      pauseRun()
      trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_ACTION.PAUSE })
    } else {
      playRun()
      trackProtocolRunEvent({
        name:
          runStatus === RUN_STATUS_IDLE
            ? ANALYTICS_PROTOCOL_RUN_ACTION.START
            : ANALYTICS_PROTOCOL_RUN_ACTION.RESUME,
        properties:
          runStatus === RUN_STATUS_IDLE && robotAnalyticsData != null
            ? robotAnalyticsData
            : {},
      })
    }
  }

  return (
    <>
      {isERActive ? (
        <ErrorRecoveryFlows
          runStatus={runStatus}
          runId={runId}
          unvalidatedFailedCommand={failedCommand}
          runLwDefsByUri={runLwDefsByUri}
          protocolAnalysis={robotSideAnalysis}
        />
      ) : null}
      {runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR && !showIntervention ? (
        <OpenDoorAlertModal
          moduleDoorLocation={doorStatus.moduleDoorLocation}
        />
      ) : null}
      {runStatus === RUN_STATUS_STOP_REQUESTED ? <CancelingRunModal /> : null}
      <div className={styles.container}>
        {robotSideAnalysis != null ? (
          <StepMeter
            totalSteps={totalIndex ?? 0}
            currentStep={
              currentRunCommandIndex != null
                ? Number(currentRunCommandIndex) + 1
                : 1
            }
          />
        ) : null}
        {showConfirmCancelRunModal ? (
          <ConfirmCancelRunModal
            runId={runId}
            setShowConfirmCancelRunModal={setShowConfirmCancelRunModal}
            isActiveRun={true}
          />
        ) : null}
        {showIntervention ? (
          <InterventionModal {...interventionProps} onResume={playRun} />
        ) : null}
        <div ref={ref} style={style} className={styles.content}>
          {robotSideAnalysis != null ? (
            <CurrentOptionView
              currentOption={currentOption}
              onStop={onStop}
              onTogglePlayPause={onTogglePlayPause}
              runId={runId}
              robotType={robotType}
              protocolName={protocolName}
              runStatus={runStatus}
              currentRunCommandIndex={currentRunCommandIndex}
              robotSideAnalysis={robotSideAnalysis}
              runTimerInfo={{
                runStatus,
                startedAt,
                stoppedAt,
                completedAt,
              }}
              lastRunCommand={lastRunCommand}
              lastAnimatedCommand={lastAnimatedCommand.current}
              updateLastAnimatedCommand={(newCommandKey: string) =>
                (lastAnimatedCommand.current = newCommandKey)
              }
              allRunDefs={allRunDefs}
            />
          ) : (
            <RunningProtocolSkeleton currentOption={currentOption} />
          )}
          <div className={styles.navigation_dots}>
            <div
              className={clsx(
                styles.bullet,
                currentOption === 'CurrentRunningProtocolCommand'
                  ? styles.bullet_active
                  : styles.bullet_inactive
              )}
            />
            <div
              className={clsx(
                styles.bullet,
                currentOption === 'RunningProtocolCommandList'
                  ? styles.bullet_active
                  : styles.bullet_inactive
              )}
            />
            <div
              className={clsx(
                styles.bullet,
                currentOption === 'ImageGallery'
                  ? styles.bullet_active
                  : styles.bullet_inactive
              )}
            />
          </div>
        </div>
      </div>
    </>
  )
}

type CurrentOptionViewProps = CurrentRunningProtocolCommandProps &
  RunningProtocolCommandListProps & { currentOption: ScreenOption }

function CurrentOptionView({
  currentOption,
  ...rest
}: CurrentOptionViewProps): JSX.Element {
  useToastOnErrorImage(rest.runId)

  switch (currentOption) {
    case 'CurrentRunningProtocolCommand':
      return <CurrentRunningProtocolCommand {...rest} />

    case 'RunningProtocolCommandList':
      return (
        <>
          <RunningProtocolCommandList {...rest} />
          <div className={styles.gradient_overlay} />
        </>
      )

    case 'ImageGallery':
      return (
        <>
          <ImageGalleryList
            {...rest}
            protocolAnalysis={rest.robotSideAnalysis}
          />
          <div className={styles.gradient_overlay} />
        </>
      )

    default:
      console.error(`Unknown screen option: ${currentOption}`)
      return <CurrentRunningProtocolCommand {...rest} />
  }
}
