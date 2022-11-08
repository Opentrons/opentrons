import * as React from 'react'
import { useTranslation } from 'react-i18next'
import dropWhile from 'lodash/dropWhile'

import {
  Box,
  Btn,
  Flex,
  Icon,
  ALIGN_STRETCH,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  DISPLAY_NONE,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_SCROLL,
  POSITION_FIXED,
  SIZE_1,
  BORDERS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  RUN_STATUS_FAILED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import { useAllCommandsQuery, useRunQuery } from '@opentrons/react-api-client'

import { NAV_BAR_WIDTH } from '../../../App/constants'
import { PrimaryButton } from '../../../atoms/buttons'
import { StyledText } from '../../../atoms/text'
import {
  useRunErrors,
  useRunStatus,
  useRunTimestamps,
} from '../../../organisms/RunTimeControl/hooks'
import { RUN_LOG_WINDOW_SIZE } from '../constants'
import { useProtocolDetailsForRun } from '../hooks'
import { DownloadRunLogToast } from '../DownloadRunLogToast'
import { RunLogProtocolSetupInfo } from './RunLogProtocolSetupInfo'
import { StepItem } from './StepItem'

import type { RunCommandSummary } from '@opentrons/api-client'
import type { RunTimeCommand, CommandStatus } from '@opentrons/shared-data'

const AVERAGE_ITEM_HEIGHT_PX = 56 // average px height of a command item
const WINDOW_OVERLAP = 40 // number of command items that fall within two adjacent windows
const NUM_EAGER_ITEMS = 5 // number of command items away from the end of the current window that will trigger a window transition if scrolled into view
const COMMANDS_REFETCH_INTERVAL = 3000
const AVERAGE_WINDOW_HEIGHT_PX =
  (RUN_LOG_WINDOW_SIZE - WINDOW_OVERLAP) * AVERAGE_ITEM_HEIGHT_PX
const NON_COMMAND_BUFFER_PX = 118 // px height of a the area below and above the windowed command items, but within the scrolled div
interface CommandRuntimeInfo {
  analysisCommand: RunTimeCommand | null // analysisCommand will only be null if protocol is nondeterministic
  runCommandSummary: RunCommandSummary | null
}

interface RunLogProps {
  robotName: string
  runId: string
}

export function RunLog({ robotName, runId }: RunLogProps): JSX.Element | null {
  const { t } = useTranslation('run_details')

  const { protocolData } = useProtocolDetailsForRun(runId)
  const { pausedAt: runPauseTime, startedAt: runStartTime } = useRunTimestamps(
    runId
  )
  const runStatus = useRunStatus(runId)
  const runErrors = useRunErrors(runId)

  const listInnerRef = React.useRef<HTMLDivElement>(null)
  const currentItemRef = React.useRef<HTMLDivElement>(null)
  const firstPostInitialPlayRunCommandIndex = React.useRef<number | null>(null)
  const lastKnownPrePlayRunCommandIndex = React.useRef<number>(-1)
  const [isDeterministic, setIsDeterministic] = React.useState<boolean>(true)
  const [windowIndex, setWindowIndex] = React.useState<number>(0)
  const [
    showDownloadRunLogToast,
    setShowDownloadRunLogToast,
  ] = React.useState<boolean>(false)

  const windowFirstCommandIndex =
    (RUN_LOG_WINDOW_SIZE - WINDOW_OVERLAP) * windowIndex
  const prePlayCommandCount =
    firstPostInitialPlayRunCommandIndex.current != null
      ? firstPostInitialPlayRunCommandIndex.current
      : lastKnownPrePlayRunCommandIndex.current + 1

  const isCurrentRun =
    useRunQuery(runId, { staleTime: Infinity }).data?.data.current ?? false
  const { data: commandsData } = useAllCommandsQuery(
    runId,
    {
      cursor: windowFirstCommandIndex + prePlayCommandCount,
      pageLength: RUN_LOG_WINDOW_SIZE,
    },
    {
      refetchInterval: COMMANDS_REFETCH_INTERVAL,
      keepPreviousData: true,
    }
  )

  const runCommands = commandsData?.data ?? []
  const currentCommandKey = commandsData?.links?.current?.meta?.key ?? null
  const currentCommandCreatedAt =
    commandsData?.links?.current?.meta?.createdAt ?? null
  const runTotalCommandCount = commandsData?.meta?.totalLength

  const [isJumpingToCurrent, setIsJumpingToCurrent] = React.useState<boolean>(
    false
  )

  const analysisCommandsWithStatus =
    protocolData?.commands != null
      ? protocolData.commands.map(command => ({
          ...command,
          status: 'queued' as CommandStatus,
        }))
      : []
  const allProtocolCommands: RunTimeCommand[] =
    protocolData != null ? analysisCommandsWithStatus : []

  const firstNonSetupIndex = allProtocolCommands.findIndex(
    command =>
      command.commandType !== 'loadLabware' &&
      command.commandType !== 'loadPipette' &&
      command.commandType !== 'loadModule'
  )

  const protocolSetupCommandList = allProtocolCommands.slice(
    0,
    firstNonSetupIndex
  )
  const postSetupAnticipatedCommands: RunTimeCommand[] = allProtocolCommands.slice(
    firstNonSetupIndex
  )

  const runStartDateTime = runStartTime != null ? new Date(runStartTime) : null
  React.useEffect(() => {
    // if viewing an historical run log, because there is no current command
    // we may get stuck with no  run commands as the default first window may
    // contain only "pre-play" commands (e.g. more LPC commands than the window size)
    // in this case, we'll walk the pointer to the first "post-play" command
    if (
      (runStatus === RUN_STATUS_FAILED ||
        runStatus === RUN_STATUS_STOPPED ||
        runStatus === RUN_STATUS_SUCCEEDED) &&
      runStartDateTime != null &&
      firstPostInitialPlayRunCommandIndex.current === null
    ) {
      const foundPostPlayRunCommandIndex = runCommands.findIndex(
        command => new Date(command?.createdAt) > runStartDateTime
      )
      if (foundPostPlayRunCommandIndex >= 0) {
        firstPostInitialPlayRunCommandIndex.current =
          lastKnownPrePlayRunCommandIndex.current +
          foundPostPlayRunCommandIndex +
          firstNonSetupIndex +
          1
      } else {
        lastKnownPrePlayRunCommandIndex.current =
          lastKnownPrePlayRunCommandIndex.current + runCommands.length
      }
    }
  }, [runId, runStatus, runCommands, runStartDateTime])
  const postInitialPlayRunCommands =
    runStartDateTime != null
      ? dropWhile(
          runCommands,
          runCommandSummary =>
            new Date(
              runCommandSummary.startedAt ?? runCommandSummary.createdAt
            ) <= runStartDateTime
        )
      : []

  let currentCommandList: CommandRuntimeInfo[] = postSetupAnticipatedCommands.map(
    postSetupAnticaptedCommand => ({
      analysisCommand: postSetupAnticaptedCommand,
      runCommandSummary: null,
    })
  )
  if (
    postInitialPlayRunCommands != null &&
    postInitialPlayRunCommands.length > 0 &&
    runStartTime != null
  ) {
    const allCommands = allProtocolCommands.map((anticipatedCommand, index) => {
      const matchedRunCommand = postInitialPlayRunCommands.find(
        runCommandSummary => runCommandSummary.key === anticipatedCommand.key
      )
      return {
        analysisCommand: anticipatedCommand,
        runCommandSummary: matchedRunCommand ?? null,
      }
    })

    currentCommandList = isDeterministic
      ? allCommands.slice(firstNonSetupIndex)
      : postInitialPlayRunCommands.map(runCommandSummary => ({
          analysisCommand: null,
          runCommandSummary,
        }))
  }

  const commandWindow = currentCommandList.slice(
    windowFirstCommandIndex,
    windowFirstCommandIndex + RUN_LOG_WINDOW_SIZE
  )

  const isFinalWindow =
    currentCommandList.length <= windowFirstCommandIndex + RUN_LOG_WINDOW_SIZE

  const currentCommandIndex = currentCommandList.findIndex(
    command => command?.analysisCommand?.key === currentCommandKey
  )
  if (currentCommandIndex >= 0 && runTotalCommandCount != null) {
    firstPostInitialPlayRunCommandIndex.current =
      runTotalCommandCount - 1 - currentCommandIndex
  }

  React.useEffect(() => {
    // if the run's current command key doesn't exist in the analysis commands
    if (
      runCommands.length > 0 &&
      currentCommandIndex < 0 &&
      firstPostInitialPlayRunCommandIndex.current != null &&
      isDeterministic
    ) {
      const isRunningSetupCommand =
        protocolSetupCommandList.find(
          command => command.key === currentCommandKey
        ) != null
      // AND the run has been started and the current step is NOT an initial setup step
      if (runStartDateTime !== null && !isRunningSetupCommand) {
        // AND the current command was created after the run was started
        if (
          currentCommandCreatedAt != null &&
          new Date(currentCommandCreatedAt) > runStartDateTime
        ) {
          // then we know that the run has diverged from the analysis expectation and
          // that this protocol is non-deterministic
          setIsDeterministic(false)
        }
      }
    }
  }, [
    runCommands,
    currentCommandIndex,
    firstPostInitialPlayRunCommandIndex,
    protocolSetupCommandList,
    currentCommandKey,
    runStartDateTime,
    currentCommandCreatedAt,
    isDeterministic,
  ])

  // We normally want to initially jump to the last window that contains
  // the current command. But, if the current item is in the final window then we
  // actually want the first window that contains the current command, in order to show as many
  // commands as possible and avoid an extra small final window
  const isCurrentCommandInFinalWindow =
    currentCommandList.length - 1 - currentCommandIndex <= RUN_LOG_WINDOW_SIZE

  const indexOfFirstWindowContainingCurrentCommand = Math.ceil(
    (currentCommandIndex + 1 - RUN_LOG_WINDOW_SIZE) /
      (RUN_LOG_WINDOW_SIZE - WINDOW_OVERLAP)
  )
  const indexOfLastWindowContainingCurrentCommand = Math.floor(
    Math.max(
      currentCommandIndex + 1 - (RUN_LOG_WINDOW_SIZE - WINDOW_OVERLAP),
      0
    ) /
      (RUN_LOG_WINDOW_SIZE - WINDOW_OVERLAP)
  )

  const jumpToCurrentCommandWindow = (): void => {
    if (
      indexOfFirstWindowContainingCurrentCommand !== windowIndex &&
      indexOfLastWindowContainingCurrentCommand !== windowIndex
    ) {
      const targetWindow = isCurrentCommandInFinalWindow
        ? indexOfFirstWindowContainingCurrentCommand
        : indexOfLastWindowContainingCurrentCommand

      setWindowIndex(Math.max(targetWindow, 0))
    }
    setIsJumpingToCurrent(true)
  }

  // when we initially mount, jump to current command window
  React.useEffect(() => {
    jumpToCurrentCommandWindow()
  }, [])

  const scrollToCurrentItem = (): void => {
    currentItemRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // if jumping to current item and on correct window index, scroll to current item
  React.useEffect(() => {
    if (
      isJumpingToCurrent &&
      (windowIndex === indexOfFirstWindowContainingCurrentCommand ||
        windowIndex === indexOfLastWindowContainingCurrentCommand)
    ) {
      scrollToCurrentItem()
      setIsJumpingToCurrent(false)
    }
  }, [windowIndex, isJumpingToCurrent])

  if (protocolData == null || runStatus == null) return null

  const topBufferHeightPx = windowFirstCommandIndex * AVERAGE_ITEM_HEIGHT_PX
  const bottomBufferHeightPx =
    (currentCommandList.length -
      (windowFirstCommandIndex + RUN_LOG_WINDOW_SIZE)) *
    AVERAGE_ITEM_HEIGHT_PX

  const onScroll = (): void => {
    if (listInnerRef.current) {
      const { scrollTop, clientHeight } = listInnerRef.current
      const potentialNextWindowFirstIndex =
        windowFirstCommandIndex + (RUN_LOG_WINDOW_SIZE - WINDOW_OVERLAP)
      const potentialPrevWindowFirstIndex =
        windowFirstCommandIndex - (RUN_LOG_WINDOW_SIZE - WINDOW_OVERLAP)

      const prevWindowBoundary =
        topBufferHeightPx + NUM_EAGER_ITEMS * AVERAGE_ITEM_HEIGHT_PX
      const nextWindowBoundary =
        topBufferHeightPx +
        Math.max(RUN_LOG_WINDOW_SIZE - NUM_EAGER_ITEMS, 0) *
          AVERAGE_ITEM_HEIGHT_PX -
        clientHeight
      if (
        !isFinalWindow &&
        potentialNextWindowFirstIndex < currentCommandList.length &&
        scrollTop >= nextWindowBoundary
      ) {
        const numberOfWindowsTraveledDown = Math.ceil(
          (scrollTop - nextWindowBoundary) / AVERAGE_WINDOW_HEIGHT_PX
        )
        setWindowIndex(windowIndex + numberOfWindowsTraveledDown)
      } else if (
        windowIndex > 0 &&
        potentialPrevWindowFirstIndex >= 0 &&
        scrollTop <= prevWindowBoundary
      ) {
        const numberOfWindowsTraveledUp = Math.ceil(
          (prevWindowBoundary - scrollTop) / AVERAGE_WINDOW_HEIGHT_PX
        )
        setWindowIndex(Math.max(windowIndex - numberOfWindowsTraveledUp, 0))
      }
    }
  }

  const onClickDownloadRunLog = (): void => {
    setShowDownloadRunLogToast(true)
  }

  const isCurrentStepBelow =
    (currentItemRef.current?.getBoundingClientRect().top != null &&
      listInnerRef.current?.getBoundingClientRect().bottom != null &&
      currentItemRef.current?.getBoundingClientRect().top >
        listInnerRef.current?.getBoundingClientRect().bottom) ||
    windowIndex < indexOfFirstWindowContainingCurrentCommand
  const isCurrentStepAbove =
    (currentItemRef.current?.getBoundingClientRect().bottom != null &&
      currentItemRef.current?.getBoundingClientRect().bottom <
        NON_COMMAND_BUFFER_PX) ||
    windowIndex > indexOfLastWindowContainingCurrentCommand

  const jumpToCurrentStepButton = (
    <PrimaryButton
      position={POSITION_FIXED}
      bottom={SPACING.spacingXXL}
      left={`calc(calc(100% + ${NAV_BAR_WIDTH})/2)`} // add width of half of nav bar to center within run tab
      transform="translate(-50%)"
      borderRadius={SPACING.spacing6}
      display={
        isCurrentRun && (isCurrentStepBelow || isCurrentStepAbove)
          ? DISPLAY_FLEX
          : DISPLAY_NONE
      }
      onClick={jumpToCurrentCommandWindow}
      id="RunLog_jumpToCurrentStep"
    >
      <Icon
        name={isCurrentStepBelow ? 'ot-arrow-down' : 'ot-arrow-up'}
        size={SIZE_1}
        marginRight={SPACING.spacing3}
      />
      {t('jump_to_current_step')}
    </PrimaryButton>
  )

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="39.875rem" // 638px
      width="100%"
      overflowY="hidden"
    >
      {runTotalCommandCount != null && showDownloadRunLogToast ? (
        <DownloadRunLogToast
          robotName={robotName}
          runId={runId}
          pageLength={runTotalCommandCount}
          onClose={() => setShowDownloadRunLogToast(false)}
        />
      ) : null}
      {jumpToCurrentStepButton}
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        borderBottom={BORDERS.lineBorder}
        padding={SPACING.spacing4}
      >
        <Flex alignItems={ALIGN_CENTER}>
          <StyledText
            marginRight={SPACING.spacing3}
            css={TYPOGRAPHY.h3SemiBold}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
          >
            {t('run_log')}
          </StyledText>
          <StyledText
            as="label"
            color={COLORS.darkGreyEnabled}
            id="RunLog_totalStepCount"
          >
            {isDeterministic
              ? t('total_step_count', { count: currentCommandList.length })
              : t('unable_to_determine_steps')}
          </StyledText>
        </Flex>
        <Btn
          color={COLORS.darkGreyEnabled}
          css={TYPOGRAPHY.labelSemiBold}
          onClick={onClickDownloadRunLog}
          id="RunLog_downloadRunLog"
        >
          {t('download_run_log')}
        </Btn>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing4}
        gridGap={SPACING.spacing3}
        height="100%"
        ref={listInnerRef}
        onScroll={onScroll}
        overflowY={OVERFLOW_SCROLL}
      >
        {runStatus === RUN_STATUS_FAILED && runErrors.length > 0
          ? runErrors.map(({ detail, errorType }, index) => (
              <StyledText
                key={index}
                color={COLORS.errorEnabled}
                marginBottom={SPACING.spacing3}
              >{`${errorType}: ${detail}`}</StyledText>
            ))
          : null}
        {protocolSetupCommandList.length > 0 ? (
          <ProtocolSetupItem
            protocolSetupCommandList={protocolSetupCommandList}
            robotName={robotName}
            runId={runId}
          />
        ) : null}
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing3}>
          <Box width="100%" height={`${topBufferHeightPx}px`} />
          {commandWindow?.map((command, index) => {
            const overallIndex = index + windowFirstCommandIndex
            const runHasFinished =
              runStatus === RUN_STATUS_FAILED ||
              runStatus === RUN_STATUS_STOPPED ||
              runStatus === RUN_STATUS_SUCCEEDED
            const isCurrentCommand =
              overallIndex === currentCommandIndex && !runHasFinished

            return (
              <Flex
                key={
                  command.analysisCommand?.id ?? command.runCommandSummary?.id
                }
                ref={isCurrentCommand ? currentItemRef : undefined}
              >
                <StepItem
                  robotName={robotName}
                  runId={runId}
                  analysisCommand={command.analysisCommand}
                  runCommandSummary={command.runCommandSummary}
                  isMostRecentCommand={isCurrentCommand}
                  runStatus={runStatus}
                  stepNumber={overallIndex + 1}
                  runPausedAt={runPauseTime}
                  runStartedAt={runStartTime}
                />
              </Flex>
            )
          })}
          {isFinalWindow ? (
            isDeterministic ? (
              <StyledText
                color={COLORS.darkGreyEnabled}
                css={TYPOGRAPHY.h6SemiBold}
                paddingY={SPACING.spacing2}
                textTransform={TYPOGRAPHY.textTransformUppercase}
              >
                {t('end_of_protocol')}
              </StyledText>
            ) : (
              <Flex justifyContent={JUSTIFY_CENTER} padding={SPACING.spacing3}>
                <StyledText as="p" color={COLORS.darkBlackEnabled}>
                  {t('run_has_diverged_from_predicted')}
                </StyledText>
              </Flex>
            )
          ) : (
            <Box width="100%" height={`${bottomBufferHeightPx}px`} />
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}

interface ProtocolSetupItemProps {
  protocolSetupCommandList: RunTimeCommand[]
  robotName: string
  runId: string
}
function ProtocolSetupItem(props: ProtocolSetupItemProps): JSX.Element {
  const { protocolSetupCommandList, robotName, runId } = props
  const [
    showProtocolSetupInfo,
    setShowProtocolSetupInfo,
  ] = React.useState<boolean>(false)
  const { t } = useTranslation('run_details')

  const handleClick = (): void => {
    setShowProtocolSetupInfo(!showProtocolSetupInfo)
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      padding={`0.75rem ${SPACING.spacing3}`}
      backgroundColor={COLORS.fundamentalsBackground}
      width="100%"
      alignSelf={ALIGN_STRETCH}
      alignItems={ALIGN_STRETCH}
    >
      <Btn onClick={handleClick}>
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
          <StyledText
            textTransform={TYPOGRAPHY.textTransformUppercase}
            color={COLORS.darkGreyEnabled}
            css={TYPOGRAPHY.h6SemiBold}
            id="RunDetails_ProtocolSetupTitle"
          >
            {t('protocol_setup')}
          </StyledText>
          <Icon
            name={showProtocolSetupInfo ? 'chevron-up' : 'chevron-down'}
            size={SIZE_1}
            color={COLORS.black}
          />
        </Flex>
      </Btn>
      <Flex
        id="RunDetails_ProtocolSetup_CommandList"
        flexDirection={DIRECTION_COLUMN}
      >
        {showProtocolSetupInfo
          ? protocolSetupCommandList.map(command => (
              <RunLogProtocolSetupInfo
                key={command.id}
                robotName={robotName}
                runId={runId}
                setupCommand={command}
              />
            ))
          : null}
      </Flex>
    </Flex>
  )
}
