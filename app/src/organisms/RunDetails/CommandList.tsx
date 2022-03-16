import * as React from 'react'
import { useTranslation } from 'react-i18next'
import dropWhile from 'lodash/dropWhile'
import {
  Flex,
  DIRECTION_COLUMN,
  TEXT_TRANSFORM_UPPERCASE,
  FONT_SIZE_CAPTION,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  Btn,
  SIZE_1,
  C_MED_DARK_GRAY,
  FONT_HEADER_DARK,
  JUSTIFY_START,
  Text,
  C_NEAR_WHITE,
  TEXT_TRANSFORM_CAPITALIZE,
  AlertItem,
  Box,
  ALIGN_STRETCH,
  ALIGN_CENTER,
} from '@opentrons/components'
import {
  RUN_STATUS_FAILED,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import { useAllCommandsQuery } from '@opentrons/react-api-client'
import {
  useCurrentRunStatus,
  useRunStartTime,
  useCurrentRunErrors,
} from '../RunTimeControl/hooks'
import { useProtocolDetails } from './hooks'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import { ProtocolSetupInfo } from './ProtocolSetupInfo'
import { CommandItem } from './CommandItem'
import type { RunStatus, RunCommandSummary } from '@opentrons/api-client'
import type {
  ProtocolAnalysisFile,
  RunTimeCommand,
  CommandStatus,
} from '@opentrons/shared-data'

const AVERAGE_ITEM_HEIGHT_PX = 52 // average px height of a command item
const WINDOW_SIZE = 60 // number of command items rendered at a time
const WINDOW_OVERLAP = 40 // number of command items that fall within two adjacent windows
const NUM_EAGER_ITEMS = 5 // number of command items away from the end of the current window that will trigger a window transition if scrolled into view
const COMMANDS_REFETCH_INTERVAL = 3000
const AVERAGE_WINDOW_HEIGHT_PX =
  (WINDOW_SIZE - WINDOW_OVERLAP) * AVERAGE_ITEM_HEIGHT_PX
interface CommandRuntimeInfo {
  analysisCommand: RunTimeCommand | null // analysisCommand will only be null if protocol is nondeterministic
  runCommandSummary: RunCommandSummary | null
}
export function CommandList(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const protocolData: ProtocolAnalysisFile | null = useProtocolDetails()
    .protocolData
  const runStartTime = useRunStartTime()
  const runStatus = useCurrentRunStatus()
  const runErrors = useCurrentRunErrors()
  const listInnerRef = React.useRef<HTMLDivElement>(null)
  const currentItemRef = React.useRef<HTMLDivElement>(null)
  const firstPostInitialPlayRunCommandIndex = React.useRef<number | null>(null)
  const [isDeterministic, setIsDeterministic] = React.useState<boolean>(true)
  const [windowIndex, setWindowIndex] = React.useState<number>(0)
  const currentRunId = useCurrentRunId()
  const windowFirstCommandIndex = (WINDOW_SIZE - WINDOW_OVERLAP) * windowIndex
  const prePlayCommandCount =
    firstPostInitialPlayRunCommandIndex.current != null
      ? firstPostInitialPlayRunCommandIndex.current
      : 0
  const { data: commandsData } = useAllCommandsQuery(
    currentRunId,
    {
      cursor: windowFirstCommandIndex + prePlayCommandCount,
      pageLength: WINDOW_SIZE,
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
  const runTotalCommandCount = commandsData?.meta.totalLength

  const [
    isInitiallyJumpingToCurrent,
    setIsInitiallyJumpingToCurrent,
  ] = React.useState<boolean>(false)

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
  const postInitialPlayRunCommands =
    runStartDateTime != null
      ? dropWhile(
          runCommands,
          runCommandSummary =>
            new Date(runCommandSummary.createdAt) <= runStartDateTime
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
    windowFirstCommandIndex + WINDOW_SIZE
  )
  const isFirstWindow = windowIndex === 0
  const isFinalWindow =
    currentCommandList.length <= windowFirstCommandIndex + WINDOW_SIZE

  const currentCommandIndex = currentCommandList.findIndex(
    command => command?.analysisCommand?.key === currentCommandKey
  )
  if (currentCommandIndex >= 0 && runTotalCommandCount != null) {
    firstPostInitialPlayRunCommandIndex.current =
      runTotalCommandCount - 1 - currentCommandIndex
  }

  // if the run's current command key doesn't exist in the analysis commands
  if (runCommands.length > 0 && currentCommandIndex < 0 && isDeterministic) {
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

  // We normally want to initially jump to the last window that contains
  // the current command. But, if the current item is in the final window then we
  // actually want the first window that contains the current command, in order to show as many
  // commands as possible and avoid an extra small final window
  const isCurrentCommandInFinalWindow =
    currentCommandList.length - 1 - currentCommandIndex <= WINDOW_SIZE

  const indexOfFirstWindowContainingCurrentCommand = Math.ceil(
    (currentCommandIndex + 1 - WINDOW_SIZE) / (WINDOW_SIZE - WINDOW_OVERLAP)
  )
  const indexOfLastWindowContainingCurrentCommand = Math.floor(
    Math.max(currentCommandIndex + 1 - (WINDOW_SIZE - WINDOW_OVERLAP), 0) /
      (WINDOW_SIZE - WINDOW_OVERLAP)
  )

  // when we initially mount, if the current item is not in view, jump to it
  React.useEffect(() => {
    if (
      indexOfFirstWindowContainingCurrentCommand !== windowIndex &&
      indexOfLastWindowContainingCurrentCommand !== windowIndex
    ) {
      const targetWindow = isCurrentCommandInFinalWindow
        ? indexOfFirstWindowContainingCurrentCommand
        : indexOfLastWindowContainingCurrentCommand
      setWindowIndex(Math.max(targetWindow, 0))
    }
    setIsInitiallyJumpingToCurrent(true)
  }, [])

  // if jumping to current item and on correct window index, scroll to current item
  React.useEffect(() => {
    if (
      isInitiallyJumpingToCurrent &&
      (windowIndex === indexOfFirstWindowContainingCurrentCommand ||
        windowIndex === indexOfLastWindowContainingCurrentCommand)
    ) {
      currentItemRef.current?.scrollIntoView({ behavior: 'smooth' })
      setIsInitiallyJumpingToCurrent(false)
    }
  }, [windowIndex, isInitiallyJumpingToCurrent])

  if (protocolData == null || runStatus == null) return null

  let alertItemTitle
  if (runStatus === 'failed') {
    alertItemTitle = t('protocol_run_failed')
  }
  if (
    runStatus === RUN_STATUS_STOP_REQUESTED ||
    runStatus === RUN_STATUS_STOPPED
  ) {
    alertItemTitle = t('protocol_run_canceled')
  }
  if (runStatus === RUN_STATUS_SUCCEEDED) {
    alertItemTitle = t('protocol_run_complete')
  }

  const topBufferHeightPx = windowFirstCommandIndex * AVERAGE_ITEM_HEIGHT_PX
  const bottomBufferHeightPx =
    (currentCommandList.length - (windowFirstCommandIndex + WINDOW_SIZE)) *
    AVERAGE_ITEM_HEIGHT_PX

  const onScroll = (): void => {
    if (listInnerRef.current) {
      const { scrollTop, clientHeight } = listInnerRef.current
      const potentialNextWindowFirstIndex =
        windowFirstCommandIndex + (WINDOW_SIZE - WINDOW_OVERLAP)
      const potentialPrevWindowFirstIndex =
        windowFirstCommandIndex - (WINDOW_SIZE - WINDOW_OVERLAP)

      const prevWindowBoundary =
        topBufferHeightPx + NUM_EAGER_ITEMS * AVERAGE_ITEM_HEIGHT_PX
      const nextWindowBoundary =
        topBufferHeightPx +
        Math.max(WINDOW_SIZE - NUM_EAGER_ITEMS, 0) * AVERAGE_ITEM_HEIGHT_PX -
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

  return (
    <Box
      height="calc(100vh - 3rem)" // height of viewport minus titlebar
      width="100%"
      ref={listInnerRef}
      onScroll={onScroll}
      overflowY="scroll"
    >
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING_2}>
        {isFirstWindow ? (
          <>
            {([
              RUN_STATUS_FAILED,
              RUN_STATUS_SUCCEEDED,
              RUN_STATUS_STOP_REQUESTED,
              RUN_STATUS_STOPPED,
            ] as RunStatus[]).includes(runStatus) ? (
              <Box padding={`${SPACING_2} ${SPACING_2} ${SPACING_2} 0`}>
                <AlertItem
                  type={
                    ([
                      RUN_STATUS_STOP_REQUESTED,
                      RUN_STATUS_FAILED,
                      RUN_STATUS_STOPPED,
                    ] as RunStatus[]).includes(runStatus)
                      ? 'error'
                      : 'success'
                  }
                  title={alertItemTitle}
                >
                  {runStatus === RUN_STATUS_FAILED && runErrors.length > 0
                    ? runErrors.map(({ detail, errorType }, index) => (
                        <Text
                          key={index}
                          marginBottom={SPACING_2}
                        >{`${errorType}: ${detail}`}</Text>
                      ))
                    : null}
                </AlertItem>
              </Box>
            ) : null}
            <Flex
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              alignItems={ALIGN_CENTER}
            >
              <Text
                paddingY={SPACING_2}
                css={FONT_HEADER_DARK}
                textTransform={TEXT_TRANSFORM_CAPITALIZE}
              >
                {t('protocol_steps')}
              </Text>
              <Text fontSize={FONT_SIZE_CAPTION} paddingY={SPACING_1}>
                {t('total_step_count', { count: currentCommandList.length })}
              </Text>
            </Flex>
            {currentCommandList[0]?.runCommandSummary == null &&
            isDeterministic ? (
              <Text fontSize={FONT_SIZE_CAPTION} marginY={SPACING_2}>
                {t('anticipated')}
              </Text>
            ) : null}
            {protocolSetupCommandList.length > 0 ? (
              <ProtocolSetupItem
                protocolSetupCommandList={protocolSetupCommandList}
              />
            ) : null}
          </>
        ) : null}
        <Flex
          fontSize={FONT_SIZE_CAPTION}
          color={C_MED_DARK_GRAY}
          flexDirection={DIRECTION_COLUMN}
        >
          <Box width="100%" height={`${topBufferHeightPx}px`} />
          {commandWindow?.map((command, index) => {
            const overallIndex = index + windowFirstCommandIndex
            const isCurrentCommand = overallIndex === currentCommandIndex

            return (
              <Flex
                key={
                  command.analysisCommand?.id ?? command.runCommandSummary?.id
                }
                justifyContent={JUSTIFY_START}
                flexDirection={DIRECTION_COLUMN}
                ref={isCurrentCommand ? currentItemRef : undefined}
                marginBottom={SPACING_2}
              >
                <CommandItem
                  analysisCommand={command.analysisCommand}
                  runCommandSummary={command.runCommandSummary}
                  isMostRecentCommand={isCurrentCommand}
                  runStatus={runStatus}
                  stepNumber={overallIndex + 1}
                  runStartedAt={runStartTime}
                />
                {isCurrentCommand &&
                isDeterministic &&
                overallIndex < currentCommandList.length - 1 ? (
                  <Text
                    fontSize={FONT_SIZE_CAPTION}
                    margin={`${SPACING_3} 0 ${SPACING_2}`}
                  >
                    {t('anticipated')}
                  </Text>
                ) : null}
              </Flex>
            )
          })}
          {isFinalWindow ? (
            <Text paddingY={SPACING_1}>{t('end_of_protocol')}</Text>
          ) : (
            <Box width="100%" height={`${bottomBufferHeightPx}px`} />
          )}
        </Flex>
      </Flex>
    </Box>
  )
}

interface ProtocolSetupItemProps {
  protocolSetupCommandList: RunTimeCommand[]
}
function ProtocolSetupItem(props: ProtocolSetupItemProps): JSX.Element {
  const { protocolSetupCommandList } = props
  const [
    showProtocolSetupInfo,
    setShowProtocolSetupInfo,
  ] = React.useState<boolean>(false)
  const { t } = useTranslation('run_details')

  return (
    <Flex marginY={SPACING_2}>
      {showProtocolSetupInfo ? (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          padding={SPACING_2}
          backgroundColor={C_NEAR_WHITE}
          width="100%"
          alignSelf={ALIGN_STRETCH}
          alignItems={ALIGN_STRETCH}
        >
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} color={C_MED_DARK_GRAY}>
            <Text
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              fontSize={FONT_SIZE_CAPTION}
              marginBottom={SPACING_2}
              id={`RunDetails_ProtocolSetupTitle`}
            >
              {t('protocol_setup')}
            </Text>
            <Btn size={SIZE_1} onClick={() => setShowProtocolSetupInfo(false)}>
              <Icon name="chevron-up" color={C_MED_DARK_GRAY} />
            </Btn>
          </Flex>
          <Flex
            id={`RunDetails_ProtocolSetup_CommandList`}
            flexDirection={DIRECTION_COLUMN}
          >
            {protocolSetupCommandList.map(command => (
              <ProtocolSetupInfo key={command.id} setupCommand={command} />
            ))}
          </Flex>
        </Flex>
      ) : (
        <Btn
          width="100%"
          role="link"
          onClick={() => setShowProtocolSetupInfo(true)}
        >
          <Flex
            fontSize={FONT_SIZE_CAPTION}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            color={C_MED_DARK_GRAY}
            backgroundColor={C_NEAR_WHITE}
          >
            <Text padding={SPACING_2}>{t('protocol_setup')}</Text>
            <Icon name={'chevron-left'} width={SIZE_1} />
          </Flex>
        </Btn>
      )}
    </Flex>
  )
}
