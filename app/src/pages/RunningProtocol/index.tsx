import * as React from 'react'
import { useParams } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  OVERFLOW_HIDDEN,
  POSITION_RELATIVE,
  POSITION_ABSOLUTE,
  ALIGN_FLEX_END,
  SPACING,
  useSwipe,
} from '@opentrons/components'
import {
  useProtocolQuery,
  useRunActionMutations,
} from '@opentrons/react-api-client'
import {
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_FINISHING,
} from '@opentrons/api-client'

import { StepMeter } from '../../atoms/StepMeter'
import { useMostRecentCompletedAnalysis } from '../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useNotifyRunQuery } from '../../resources/runs'
import { InterventionModal } from '../../organisms/InterventionModal'
import { isInterventionCommand } from '../../organisms/InterventionModal/utils'
import {
  useRunStatus,
  useRunTimestamps,
} from '../../organisms/RunTimeControl/hooks'
import {
  CurrentRunningProtocolCommand,
  RunningProtocolCommandList,
  RunningProtocolSkeleton,
} from '../../organisms/OnDeviceDisplay/RunningProtocol'
import {
  useTrackProtocolRunEvent,
  useRobotAnalyticsData,
  useRobotType,
} from '../../organisms/Devices/hooks'
import { CancelingRunModal } from '../../organisms/OnDeviceDisplay/RunningProtocol/CancelingRunModal'
import { ConfirmCancelRunModal } from '../../organisms/OnDeviceDisplay/RunningProtocol/ConfirmCancelRunModal'
import { getLocalRobot } from '../../redux/discovery'
import { OpenDoorAlertModal } from '../../organisms/OpenDoorAlertModal'
import {
  useErrorRecoveryFlows,
  ErrorRecoveryFlows,
} from '../../organisms/ErrorRecoveryFlows'
import { useLastRunCommand } from '../../organisms/Devices/hooks/useLastRunCommand'

import type { OnDeviceRouteParams } from '../../App/types'

const RUN_STATUS_REFETCH_INTERVAL = 5000
const LIVE_RUN_COMMANDS_POLL_MS = 3000
interface BulletProps {
  isActive: boolean
}
const Bullet = styled.div`
  height: 0.5rem;
  width: 0.5rem;
  border-radius: 50%;
  z-index: 2;
  background: ${(props: BulletProps) =>
    props.isActive ? COLORS.grey50 : COLORS.grey40};
  transform: ${(props: BulletProps) =>
    props.isActive ? 'scale(2)' : 'scale(1)'};
`

export type ScreenOption =
  | 'CurrentRunningProtocolCommand'
  | 'RunningProtocolCommandList'

export function RunningProtocol(): JSX.Element {
  const { runId } = useParams<OnDeviceRouteParams>()
  const [currentOption, setCurrentOption] = React.useState<ScreenOption>(
    'CurrentRunningProtocolCommand'
  )
  const [
    showConfirmCancelRunModal,
    setShowConfirmCancelRunModal,
  ] = React.useState<boolean>(false)
  const [
    interventionModalCommandKey,
    setInterventionModalCommandKey,
  ] = React.useState<string | null>(null)
  const lastAnimatedCommand = React.useRef<string | null>(null)
  const swipe = useSwipe()
  const robotSideAnalysis = useMostRecentCompletedAnalysis(runId)
  const lastRunCommand = useLastRunCommand(runId, {
    refetchInterval: LIVE_RUN_COMMANDS_POLL_MS,
  })

  const totalIndex = robotSideAnalysis?.commands.length
  const currentRunCommandIndex = robotSideAnalysis?.commands.findIndex(
    c => c.key === lastRunCommand?.key
  )
  const runStatus = useRunStatus(runId, {
    refetchInterval: RUN_STATUS_REFETCH_INTERVAL,
  })
  const { startedAt, stoppedAt, completedAt } = useRunTimestamps(runId)
  const { data: runRecord } = useNotifyRunQuery(runId, { staleTime: Infinity })
  const protocolId = runRecord?.data.protocolId ?? null
  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })
  const protocolName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name
  const { playRun, pauseRun } = useRunActionMutations(runId)
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot != null ? localRobot.name : 'no name'
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const robotAnalyticsData = useRobotAnalyticsData(robotName)
  const robotType = useRobotType(robotName)
  const { isERActive, failedCommand } = useErrorRecoveryFlows(runId, runStatus)

  React.useEffect(() => {
    if (
      currentOption === 'CurrentRunningProtocolCommand' &&
      swipe.swipeType === 'swipe-left'
    ) {
      setCurrentOption('RunningProtocolCommandList')
      swipe.setSwipeType('')
    }

    if (
      currentOption === 'RunningProtocolCommandList' &&
      swipe.swipeType === 'swipe-right'
    ) {
      setCurrentOption('CurrentRunningProtocolCommand')
      swipe.setSwipeType('')
    }
  }, [currentOption, swipe, swipe.setSwipeType])

  React.useEffect(() => {
    if (
      lastRunCommand != null &&
      interventionModalCommandKey != null &&
      lastRunCommand.key !== interventionModalCommandKey
    ) {
      // set intervention modal command key to null if different from current command key
      setInterventionModalCommandKey(null)
    } else if (
      lastRunCommand?.key != null &&
      isInterventionCommand(lastRunCommand) &&
      interventionModalCommandKey === null
    ) {
      setInterventionModalCommandKey(lastRunCommand.key)
    }
  }, [lastRunCommand, interventionModalCommandKey])

  return (
    <>
      {isERActive ? (
        <ErrorRecoveryFlows
          isFlex={true}
          runId={runId}
          failedCommand={failedCommand}
        />
      ) : null}
      {runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR ? (
        <OpenDoorAlertModal />
      ) : null}
      {runStatus === RUN_STATUS_STOP_REQUESTED ? <CancelingRunModal /> : null}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        position={POSITION_RELATIVE}
        overflow={OVERFLOW_HIDDEN}
      >
        {robotSideAnalysis != null ? (
          <StepMeter
            totalSteps={totalIndex != null ? totalIndex : 0}
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
        {interventionModalCommandKey != null &&
        runRecord?.data != null &&
        lastRunCommand != null &&
        isInterventionCommand(lastRunCommand) &&
        runStatus !== RUN_STATUS_FINISHING ? (
          <InterventionModal
            robotName={robotName}
            command={lastRunCommand}
            onResume={playRun}
            run={runRecord.data}
            analysis={robotSideAnalysis}
          />
        ) : null}
        <Flex
          ref={swipe.ref}
          padding={`1.75rem ${SPACING.spacing40} ${SPACING.spacing40}`}
          flexDirection={DIRECTION_COLUMN}
        >
          {robotSideAnalysis != null ? (
            currentOption === 'CurrentRunningProtocolCommand' ? (
              <CurrentRunningProtocolCommand
                playRun={playRun}
                pauseRun={pauseRun}
                setShowConfirmCancelRunModal={setShowConfirmCancelRunModal}
                trackProtocolRunEvent={trackProtocolRunEvent}
                robotType={robotType}
                robotAnalyticsData={robotAnalyticsData}
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
              />
            ) : (
              <>
                <RunningProtocolCommandList
                  protocolName={protocolName}
                  runStatus={runStatus}
                  robotType={robotType}
                  playRun={playRun}
                  pauseRun={pauseRun}
                  setShowConfirmCancelRunModal={setShowConfirmCancelRunModal}
                  trackProtocolRunEvent={trackProtocolRunEvent}
                  robotAnalyticsData={robotAnalyticsData}
                  currentRunCommandIndex={currentRunCommandIndex}
                  robotSideAnalysis={robotSideAnalysis}
                />
                <Flex
                  css={css`
                    background: linear-gradient(
                      rgba(255, 0, 0, 0) 85%,
                      #ffffff
                    );
                  `}
                  position={POSITION_ABSOLUTE}
                  height="20.25rem"
                  width="59rem"
                  marginTop="9.25rem"
                  alignSelf={ALIGN_FLEX_END}
                />
              </>
            )
          ) : (
            <RunningProtocolSkeleton currentOption={currentOption} />
          )}
          <Flex
            marginTop={SPACING.spacing32}
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing16}
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
          >
            <Bullet
              isActive={currentOption === 'CurrentRunningProtocolCommand'}
            />
            <Bullet isActive={currentOption === 'RunningProtocolCommandList'} />
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
