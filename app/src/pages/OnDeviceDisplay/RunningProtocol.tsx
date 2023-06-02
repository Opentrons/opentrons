import * as React from 'react'
import { useParams, Link } from 'react-router-dom'
import styled from 'styled-components'
import { useSelector } from 'react-redux'

import {
  Flex,
  Box,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
  COLORS,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  POSITION_RELATIVE,
  OVERFLOW_HIDDEN,
  ALIGN_FLEX_START,
  ALIGN_FLEX_END,
} from '@opentrons/components'
import {
  useProtocolQuery,
  useRunQuery,
  useRunActionMutations,
} from '@opentrons/react-api-client'

import { TertiaryButton } from '../../atoms/buttons'
import { StepMeter } from '../../atoms/StepMeter'
import { useMostRecentCompletedAnalysis } from '../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useLastRunCommandKey } from '../../organisms/Devices/hooks/useLastRunCommandKey'
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
} from '../../organisms/Devices/hooks'
import { ConfirmCancelRunModal } from '../../organisms/OnDeviceDisplay/RunningProtocol/ConfirmCancelRunModal'
import { getLocalRobot } from '../../redux/discovery'

import type { OnDeviceRouteParams } from '../../App/types'


const HALF_SCREEN_WIDTH_PX = 512
const SCROLL_DEBOUNCE_MS = 250
interface BulletProps {
  isActive: boolean
}
const Bullet = styled.div`
  height: 0.5rem;
  width: 0.5rem;
  border-radius: 50%;
  z-index: 2;
  background: ${(props: BulletProps) =>
    props.isActive ? COLORS.darkBlack60 : COLORS.darkBlack40};
  transform: ${(props: BulletProps) =>
    props.isActive ? 'scale(2)' : 'scale(1)'};
`

export type ScreenOption =
  | 'CurrentRunningProtocolCommand'
  | 'RunningProtocolCommandList'

export function RunningProtocol(): JSX.Element {
  const { runId } = useParams<OnDeviceRouteParams>()
  const [
    showConfirmCancelRunModal,
    setShowConfirmCancelRunModal,
  ] = React.useState<boolean>(false)
  const robotSideAnalysis = useMostRecentCompletedAnalysis(runId)
  const currentRunCommandKey = useLastRunCommandKey(runId)
  const totalIndex = robotSideAnalysis?.commands.length
  const currentRunCommandIndex = robotSideAnalysis?.commands.findIndex(
    c => c.key === currentRunCommandKey
  )
  const runStatus = useRunStatus(runId)
  const { startedAt, stoppedAt, completedAt } = useRunTimestamps(runId)
  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const protocolId = runRecord?.data.protocolId ?? null
  const { data: protocolRecord } = useProtocolQuery(protocolId, {
    staleTime: Infinity,
  })
  const protocolName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name
  const { playRun, pauseRun } = useRunActionMutations(runId)
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId)
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot != null ? localRobot.name : 'no name'
  const robotAnalyticsData = useRobotAnalyticsData(robotName)

  const horizontalScrollContainerRef = React.useRef<HTMLDivElement | null>(null)
  const commandViewRef = React.useRef<HTMLDivElement | null>(null)
  const listViewRef = React.useRef<HTMLDivElement | null>(null)
  const [isScrolling, setIsScrolling] = React.useState(false)
  const [scrollLeft, setScrollLeft] = React.useState(0)
  const handleHorizontalScroll: React.UIEventHandler = (event) => {
    setScrollLeft(event.currentTarget.scrollLeft)
    setIsScrolling(true)
  }
  const isCommandViewVisible = scrollLeft <= HALF_SCREEN_WIDTH_PX
  const isListViewVisible = scrollLeft > HALF_SCREEN_WIDTH_PX

  React.useEffect(() => {
    if (isScrolling) {
      const timer = setTimeout(() => {
        setIsScrolling(false)
      }, SCROLL_DEBOUNCE_MS)
      return () => clearTimeout(timer)
    } else {
      if (listViewRef.current != null && scrollLeft > HALF_SCREEN_WIDTH_PX) {
        listViewRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
      else if (commandViewRef.current != null && scrollLeft <= HALF_SCREEN_WIDTH_PX) {
        commandViewRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }

  }, [isScrolling])

  return (
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
      <Flex
        padding={`1.75rem ${SPACING.spacing40} ${SPACING.spacing40}`}
        flexDirection={DIRECTION_COLUMN}
      >
        <CarouselWrapper
          ref={horizontalScrollContainerRef}
          onScroll={handleHorizontalScroll}
        >
          {robotSideAnalysis != null ? (
            <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing80} marginX={SPACING.spacing40}>
              <Box ref={listViewRef} width="944px" height="100%">
                <CurrentRunningProtocolCommand
                  playRun={playRun}
                  pauseRun={pauseRun}
                  setShowConfirmCancelRunModal={setShowConfirmCancelRunModal}
                  trackProtocolRunEvent={trackProtocolRunEvent}
                  robotAnalyticsData={robotAnalyticsData}
                  protocolName={protocolName}
                  runStatus={runStatus}
                  currentRunCommandIndex={currentRunCommandIndex}
                  robotSideAnalysis={robotSideAnalysis}
                  runTimerInfo={{ runStatus, startedAt, stoppedAt, completedAt }}
                />
              </Box>
              <Box ref={commandViewRef} width="944px" height="100%">
                <RunningProtocolCommandList
                  protocolName={protocolName}
                  runStatus={runStatus}
                  playRun={playRun}
                  pauseRun={pauseRun}
                  setShowConfirmCancelRunModal={setShowConfirmCancelRunModal}
                  trackProtocolRunEvent={trackProtocolRunEvent}
                  robotAnalyticsData={robotAnalyticsData}
                  currentRunCommandIndex={currentRunCommandIndex}
                  robotSideAnalysis={robotSideAnalysis}
                />
              </Box>
            </Flex>
          ) : (
            <RunningProtocolSkeleton />
          )}
        </CarouselWrapper>
        <Flex
          marginTop="2rem"
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing16}
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
        >
          <Bullet isActive={isCommandViewVisible} onClick={() => {
            if (listViewRef.current != null) {
              listViewRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
            }
          }} />
          <Bullet isActive={isListViewVisible}
            onClick={() => {
              if (commandViewRef.current != null) {
                commandViewRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
              }
            }}
          />
        </Flex>
      </Flex>
    </Flex >
  )
}

const CarouselWrapper = styled.div`
  display: flex;
  flex-direction: ${DIRECTION_ROW};
  align-items: ${ALIGN_FLEX_START};
  margin-right: -${SPACING.spacing40};
  margin-left: -${SPACING.spacing40};
  overflow-x: scroll;

  &::-webkit-scrollbar {
    display: none;
  }
`
