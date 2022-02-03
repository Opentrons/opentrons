import * as React from 'react'
import { useTranslation } from 'react-i18next'
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
import { useRunStatus, useRunStartTime } from '../RunTimeControl/hooks'
import { useProtocolDetails } from './hooks'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import { ProtocolSetupInfo } from './ProtocolSetupInfo'
import { CommandItem } from './CommandItem'
import type { RunStatus, RunCommandSummary } from '@opentrons/api-client'
import type {
  ProtocolFile,
  RunTimeCommand,
  CommandStatus,
} from '@opentrons/shared-data'

const AVERAGE_ITEM_HEIGHT_PX = 52 // average px height of a command item
const WINDOW_SIZE = 60 // number of command items rendered at a time
const WINDOW_OVERLAP = 40 // number of command items that fall within two adjacent windows
const COMMANDS_REFETCH_INTERVAL = 3000
interface CommandRuntimeInfo {
  analysisCommand: RunTimeCommand | null // analysisCommand will only be null if protocol is nondeterministic
  runCommandSummary: RunCommandSummary | null
}

export function CommandList(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const protocolData: ProtocolFile<{}> | null = useProtocolDetails()
    .protocolData
  const runStartTime = useRunStartTime()
  const runStatus = useRunStatus()
  const listInnerRef = React.useRef<HTMLDivElement>(null)
  const currentItemRef = React.useRef<HTMLDivElement>(null)
  const [windowIndex, setWindowIndex] = React.useState<number>(0)
  const currentRunId = useCurrentRunId()
  const windowFirstCommandIndex = (WINDOW_SIZE - WINDOW_OVERLAP) * windowIndex
  const { data: commandsData } = useAllCommandsQuery(
    currentRunId,
    {
      cursor: windowFirstCommandIndex,
      pageLength: WINDOW_SIZE,
    },
    {
      refetchInterval: COMMANDS_REFETCH_INTERVAL,
      keepPreviousData: true,
    }
  )
  const totalRunCommandCount = commandsData?.meta.totalLength ?? 0
  const runCommands = commandsData?.data ?? []

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

  let currentCommandList: CommandRuntimeInfo[] = postSetupAnticipatedCommands.map(
    postSetupAnticaptedCommand => ({
      analysisCommand: postSetupAnticaptedCommand,
      runCommandSummary: null,
    })
  )
  if (runCommands != null && runCommands.length > 0 && runStartTime != null) {
    const allCommands = allProtocolCommands.map((anticipatedCommand, index) => {
      const isAnticipated = index + 1 > totalRunCommandCount
      const matchedRunCommand = runCommands.find(
        runCommandSummary => runCommandSummary.key === anticipatedCommand.key
      )
      if (!isAnticipated && matchedRunCommand != null) {
        return {
          analysisCommand: anticipatedCommand,
          runCommandSummary: matchedRunCommand,
        }
      } else {
        return {
          analysisCommand: anticipatedCommand,
          runCommandSummary: null,
        }
      }
    })

    // TODO(bc, 2022-02-02): now that we don't have all of the run commands at once,
    // we need to develop another approach to tell if protocol is deterministic, perhaps on backend

    currentCommandList = allCommands.slice(firstNonSetupIndex)
  }

  const commandWindow = currentCommandList.slice(
    windowFirstCommandIndex,
    windowFirstCommandIndex + WINDOW_SIZE
  )
  const isFirstWindow = windowIndex === 0
  const isFinalWindow =
    currentCommandList.length - 1 <= windowFirstCommandIndex + WINDOW_SIZE

  const currentCommandIndex =
    totalRunCommandCount - 1 - protocolSetupCommandList.length
  const indexOfWindowContainingCurrentItem = Math.floor(
    Math.max(currentCommandIndex - (WINDOW_SIZE - WINDOW_OVERLAP), 0) /
      (WINDOW_SIZE - WINDOW_OVERLAP)
  )

  // when we initially mount, if the current item is not in view, jump to it
  React.useEffect(() => {
    if (indexOfWindowContainingCurrentItem !== windowIndex) {
      setWindowIndex(indexOfWindowContainingCurrentItem)
    }
    setIsInitiallyJumpingToCurrent(true)
  }, [])

  // if jumping to current item and on correct window index, scroll to current item
  React.useEffect(() => {
    if (
      isInitiallyJumpingToCurrent &&
      windowIndex === indexOfWindowContainingCurrentItem
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
      if (
        !isFinalWindow &&
        potentialNextWindowFirstIndex < currentCommandList.length &&
        scrollTop >=
          topBufferHeightPx +
            (WINDOW_SIZE - 5) * AVERAGE_ITEM_HEIGHT_PX -
            clientHeight
      ) {
        setWindowIndex(windowIndex + 1)
      } else if (
        windowIndex > 0 &&
        potentialPrevWindowFirstIndex >= 0 &&
        scrollTop <= topBufferHeightPx + 5 * AVERAGE_ITEM_HEIGHT_PX
      ) {
        setWindowIndex(windowIndex - 1)
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
                />
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
            {currentCommandIndex <= 0 ? (
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
            const showAnticipatedStepsTitle =
              overallIndex !== currentCommandList.length - 1 && isCurrentCommand

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
                  hasBeenRun={overallIndex <= currentCommandIndex}
                  runStatus={runStatus}
                  stepNumber={overallIndex + 1}
                  runStartedAt={runStartTime}
                />
                {showAnticipatedStepsTitle && (
                  <Text
                    fontSize={FONT_SIZE_CAPTION}
                    margin={`${SPACING_3} 0 ${SPACING_2}`}
                  >
                    {t('anticipated')}
                  </Text>
                )}
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
