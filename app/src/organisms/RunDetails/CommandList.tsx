import dropWhile from 'lodash/dropWhile'
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
import { useRunStatus, useRunStartTime } from '../RunTimeControl/hooks'
import { useProtocolDetails } from './hooks'
import { useCurrentRunCommands, useCurrentRunId } from '../ProtocolUpload/hooks'
import { ProtocolSetupInfo } from './ProtocolSetupInfo'
import { CommandItem } from './CommandItem'
import type { RunStatus, RunCommandSummary } from '@opentrons/api-client'
import type {
  ProtocolFile,
  RunTimeCommand,
  CommandStatus,
} from '@opentrons/shared-data'

const WINDOW_SIZE = 100 // number of command items rendered at a time
const WINDOW_OVERLAP = 50 // number of command items that fall within two adjacent windows
const EAGER_BUFFER_COEFFICIENT = 0.5 // multiplied by clientHeight to determine number of pixels away from the next window required for it to load
interface CommandRuntimeInfo {
  analysisCommand: RunTimeCommand | null // analysisCommand will only be null if protocol is nondeterministic
  runCommandSummary: RunCommandSummary | null
}

export function CommandList(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const protocolData: ProtocolFile<{}> | null = useProtocolDetails()
    .protocolData
  const currentRunId = useCurrentRunId()
  const runStartTime = useRunStartTime()
  const runCommands = useCurrentRunCommands()
  const runStatus = useRunStatus()
  const listInnerRef = React.useRef<HTMLDivElement>(null)
  const currentItemRef = React.useRef<HTMLDivElement>(null)
  const [windowIndex, setWindowIndex] = React.useState<number>(0)
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
  let postPlayRunCommands: CommandRuntimeInfo[] = []
  if (
    runCommands != null &&
    runCommands.length > 0 &&
    runStartTime != null
  ) {
    const firstPostPlayRunCommandIndex = runCommands.findIndex(
      command => command.key === postSetupAnticipatedCommands[0]?.key
    )
    postPlayRunCommands =
      firstPostPlayRunCommandIndex >= 0
        ? runCommands
            .slice(firstPostPlayRunCommandIndex)
            .map(runDataCommand => ({
              runCommandSummary: runDataCommand,
              analysisCommand:
                postSetupAnticipatedCommands.find(
                  postSetupAnticipatedCommand =>
                    runDataCommand.key === postSetupAnticipatedCommand.key
                ) ?? null,
            }))
        : []

    const remainingAnticipatedCommands = dropWhile(
      postSetupAnticipatedCommands,
      anticipatedCommand =>
        runCommands.some(runC => runC.key === anticipatedCommand.key)
    ).map(remainingAnticipatedCommand => ({
      analysisCommand: remainingAnticipatedCommand,
      runCommandSummary: null,
    }))

    const isProtocolDeterministic = postPlayRunCommands.reduce(
      (isDeterministic, command, index) => {
        return (
          isDeterministic &&
          command.runCommandSummary?.key ===
            postSetupAnticipatedCommands[index]?.key
        )
      },
      true
    )

    currentCommandList = isProtocolDeterministic
      ? [...postPlayRunCommands, ...remainingAnticipatedCommands]
      : [...postPlayRunCommands]
  }

  const windowFirstCommandIndex = WINDOW_OVERLAP * windowIndex
  const commandWindow = currentCommandList.slice(
    windowFirstCommandIndex,
    windowFirstCommandIndex + WINDOW_SIZE
  )
  const isFirstWindow = windowIndex === 0
  const isFinalWindow =
    currentCommandList.length - 1 <= windowFirstCommandIndex + WINDOW_SIZE

  const currentItemIndex = currentCommandList.findIndex(
    command =>
      command.runCommandSummary == null ||
      command.runCommandSummary.status === 'running' ||
      command.runCommandSummary.status === 'failed' ||
      command.runCommandSummary.status === 'queued'
  )
  const indexOfWindowContainingCurrentItem = Math.floor(
    Math.max(currentItemIndex - (WINDOW_SIZE - WINDOW_OVERLAP), 0) /
      WINDOW_OVERLAP
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

  const onScroll = (): void => {
    if (listInnerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listInnerRef.current
      if (
        scrollTop + clientHeight + EAGER_BUFFER_COEFFICIENT * clientHeight >=
          scrollHeight &&
        !isFinalWindow
      ) {
        const potentialNextWindowFirstIndex =
          windowFirstCommandIndex + WINDOW_OVERLAP
        if (potentialNextWindowFirstIndex < currentCommandList.length) {
          setWindowIndex(windowIndex + 1)
        }
      } else if (scrollTop <= EAGER_BUFFER_COEFFICIENT * clientHeight) {
        const potentialPrevWindowFirstIndex =
          windowFirstCommandIndex - WINDOW_OVERLAP
        if (windowIndex > 0 && potentialPrevWindowFirstIndex >= 0) {
          setWindowIndex(windowIndex - 1)
          listInnerRef.current?.scrollTo({ top: 1 })
        }
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
            {currentCommandList[0]?.runCommandSummary == null ? (
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
          {commandWindow?.map((command, index) => {
            const overallIndex = index + windowFirstCommandIndex
            const isCurrentCommand =
              command.runCommandSummary != null &&
              ['running', 'failed'].includes(command.runCommandSummary.status)
            const showAnticipatedStepsTitle =
              overallIndex !== currentCommandList.length - 1 && isCurrentCommand

            return (
              <Flex
                key={
                  command.analysisCommand?.id ?? command.runCommandSummary?.id
                }
                id={`RunDetails_CommandItem`}
                justifyContent={JUSTIFY_START}
                flexDirection={DIRECTION_COLUMN}
                ref={isCurrentCommand ? currentItemRef : undefined}
                marginBottom={SPACING_2}
              >
                <CommandItem
                  analysisCommand={command.analysisCommand}
                  runCommandSummary={command.runCommandSummary}
                  runStatus={runStatus}
                  currentRunId={currentRunId ?? null}
                  stepNumber={overallIndex + 1}
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
            <Text paddingY={SPACING_1} marginBottom="98vh">
              {t('end_of_protocol')}
            </Text>
          ) : null}
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
              <ProtocolSetupInfo
                key={command.id}
                setupCommand={command as RunTimeCommand}
              />
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
