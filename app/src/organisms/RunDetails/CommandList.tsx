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
import { RunCommandSummary, RUN_STATUS_FAILED, RUN_STATUS_IDLE, RUN_STATUS_STOP_REQUESTED, RUN_STATUS_STOPPED, RUN_STATUS_SUCCEEDED } from '@opentrons/api-client'
import { useRunStatus } from '../RunTimeControl/hooks'
import { useProtocolDetails } from './hooks'
import { useCurrentProtocolRun } from '../ProtocolUpload/hooks'
import { ProtocolSetupInfo } from './ProtocolSetupInfo'
import { CommandItem } from './CommandItem'
import type {
  ProtocolFile,
  RunTimeCommand,
  CommandStatus,
} from '@opentrons/shared-data'

const WINDOW_SIZE = 100 // number of command items rendered at a time
const WINDOW_OVERLAP = 50 // number of command items that fall within two adjacent windows
const EAGER_BUFFER_COEFFICIENT = 0.5 // multiplied by clientHeight to determine number of pixels away from the next window required for it to load

export function CommandList(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const protocolData: ProtocolFile<{}> | null = useProtocolDetails()
    .protocolData
  const { runRecord } = useCurrentProtocolRun()
  const runStatus = useRunStatus()
  const listInnerRef = React.useRef<HTMLDivElement>()
  const currentItemRef = React.useRef<HTMLDivElement>()
  const runDataCommands = runRecord?.data.commands
  const [windowIndex, setWindowIndex] = React.useState<number>(0)
  const [isJumpingToCurrent, setIsJumpingToCurrent] = React.useState<boolean>(false)
  React.useEffect(
    () => {
      if (isJumpingToCurrent) {
        currentItemRef.current?.scrollIntoView({behavior: 'smooth'})
        setIsJumpingToCurrent(false)
      }
    },
    [windowIndex, isJumpingToCurrent]
  )
  const firstPlayTimestamp = runRecord?.data.actions.find(
    action => action.actionType === 'play'
  )?.createdAt

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

  interface CommandRuntimeInfo {
    analysisCommand: RunTimeCommand | null // analysisCommand will only be null if protocol is nondeterministic
    runCommandSummary: RunCommandSummary | null
  }

  let currentCommandList: CommandRuntimeInfo[] = postSetupAnticipatedCommands.map(
    postSetupAnticaptedCommand => ({
      analysisCommand: postSetupAnticaptedCommand,
      runCommandSummary: null,
    })
  )
  if (
    runDataCommands != null &&
    runDataCommands.length > 0 &&
    firstPlayTimestamp != null
  ) {
    const firstPostPlayRunCommandIndex = runDataCommands.findIndex(
      command => command.key === postSetupAnticipatedCommands[0]?.key
    )
    const postPlayRunCommands =
      firstPostPlayRunCommandIndex >= 0
        ? runDataCommands
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
        runDataCommands.some(runC => runC.key === anticipatedCommand.key)
    ).map(remainingAnticipatedCommand => ({
      analysisCommand: remainingAnticipatedCommand,
      runCommandSummary: null,
    }))

    const isProtocolDeterministic = postPlayRunCommands.reduce(
      (isDeterministic, command, index) => {
        return (
          isDeterministic &&
          command.runCommandSummary.key ===
            postSetupAnticipatedCommands[index]?.key
        )
      },
      true
    )

    currentCommandList = isProtocolDeterministic
      ? [...postPlayRunCommands, ...remainingAnticipatedCommands]
      : [...postPlayRunCommands]
  }

  if (protocolData == null || runStatus == null) return null

  let alertItemTitle
  if (runStatus === 'failed') {
    alertItemTitle = t('protocol_run_failed')
  }
  if (runStatus === RUN_STATUS_STOP_REQUESTED || runStatus === RUN_STATUS_STOPPED) {
    alertItemTitle = t('protocol_run_canceled')
  }
  if (runStatus === RUN_STATUS_SUCCEEDED) {
    alertItemTitle = t('protocol_run_complete')
  }

  const windowFirstIndex = WINDOW_OVERLAP * windowIndex
  const commandWindow = currentCommandList.slice(
    windowFirstIndex,
    windowFirstIndex + WINDOW_SIZE
  )
  const isFirstWindow = windowIndex === 0
  const isFinalWindow =
    (currentCommandList.length - 1) <= windowFirstIndex + WINDOW_SIZE &&
    (currentCommandList.length - 1) >= windowFirstIndex

  const onScroll = () => {
    if (listInnerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listInnerRef.current
      const firstIndexInWindow = windowIndex * WINDOW_SIZE
      if (scrollTop + clientHeight + (EAGER_BUFFER_COEFFICIENT * clientHeight) >= scrollHeight) {
        const potentialNextWindowFirstIndex =
          firstIndexInWindow + WINDOW_OVERLAP
        if (potentialNextWindowFirstIndex < currentCommandList.length) {
          setWindowIndex(windowIndex + 1)
        }
      } else if (scrollTop <= (EAGER_BUFFER_COEFFICIENT * clientHeight)) {
        const potentialPrevWindowFirstIndex =
          firstIndexInWindow - WINDOW_OVERLAP
        if (windowIndex > 0 && potentialPrevWindowFirstIndex >= 0) {
          setWindowIndex(windowIndex - 1)
          listInnerRef.current?.scrollTo({ top: 1})
        }
      }
    }
  }

  const handleJumpToCurrentItem = () => {
    const currentItemIndex = currentCommandList.findIndex(command =>  command.runCommandSummary == null || command.runCommandSummary.status === 'running')
    const windowIndexWithCurrentItem = Math.floor(currentItemIndex / WINDOW_OVERLAP);
    setWindowIndex(windowIndexWithCurrentItem)
    setIsJumpingToCurrent(true)
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
            {[RUN_STATUS_FAILED, RUN_STATUS_SUCCEEDED, RUN_STATUS_STOP_REQUESTED, RUN_STATUS_STOPPED].includes(runStatus) ? (
              <Box padding={`${SPACING_2} ${SPACING_2} ${SPACING_2} 0`}>
                <AlertItem
                  type={[RUN_STATUS_STOP_REQUESTED, RUN_STATUS_FAILED, RUN_STATUS_STOPPED].includes(runStatus) ? 'error' : 'success'}
                  title={alertItemTitle}
                />
              </Box>
            ) : null}
            <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
              <Text
                paddingY={SPACING_2}
                css={FONT_HEADER_DARK}
                textTransform={TEXT_TRANSFORM_CAPITALIZE}
              >
                {t('protocol_steps')}
              </Text>
              <Text fontSize={FONT_SIZE_CAPTION} paddingY={SPACING_1}>{t('total_step_count', {count: currentCommandList.length} )}</Text>
            </Flex>
            {protocolSetupCommandList.length > 0
              ? <ProtocolSetupItem protocolSetupCommandList={protocolSetupCommandList} />
              : null
            }
          </>
        ) : null}
        <Flex
          fontSize={FONT_SIZE_CAPTION}
          color={C_MED_DARK_GRAY}
          flexDirection={DIRECTION_COLUMN}
        >
          {commandWindow?.map((command, index) => {
            const isCurrentCommand =
              command.runCommandSummary?.status === 'running'
            const showAnticipatedStepsTitle =
              index != commandWindow.length - 1 && isCurrentCommand

            return (
              <Flex
                key={
                  command.analysisCommand?.id ?? command.runCommandSummary?.id
                }
                id={`RunDetails_CommandItem`}
                justifyContent={JUSTIFY_START}
                flexDirection={DIRECTION_COLUMN}
                ref={isCurrentCommand ? currentItemRef : () => {}}
                marginBottom={SPACING_2}
              >
                <CommandItem
                  analysisCommand={command.analysisCommand}
                  runCommandSummary={command.runCommandSummary}
                  runStatus={runStatus}
                  currentRunId={runRecord?.data.id ?? null}
                  stepNumber={index + windowFirstIndex + 1}
                />
                {showAnticipatedStepsTitle && (
                  <Text fontSize={FONT_SIZE_CAPTION} margin={`${SPACING_3} 0 ${SPACING_2}`}>
                    {t('anticipated')}
                  </Text>
                )}
              </Flex>
            )
          })}
          {isFinalWindow ? (
            <Flex paddingY={SPACING_1}>{t('end_of_protocol')}</Flex>
          ) : null}
        </Flex>
      </Flex>
    </Box>
  )
}

interface ProtocolSetupItemProps {
  protocolSetupCommandList: RunTimeCommand[]
}
function ProtocolSetupItem(props: ProtocolSetupItemProps) {
  const {protocolSetupCommandList} = props
  const [
    showProtocolSetupInfo,
    setShowProtocolSetupInfo,
  ] = React.useState<boolean>(false)
  const { t } = useTranslation('run_details')

  return (
    <Flex marginY={SPACING_2} >
      {showProtocolSetupInfo ? (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          padding={SPACING_2}
          backgroundColor={C_NEAR_WHITE}
          width="100%"
          alignSelf={ALIGN_STRETCH}
          alignItems={ALIGN_STRETCH}
        >
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            color={C_MED_DARK_GRAY}
          >
            <Text
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              fontSize={FONT_SIZE_CAPTION}
              marginBottom={SPACING_2}
              id={`RunDetails_ProtocolSetupTitle`}
            >
              {t('protocol_setup')}
            </Text>
            <Btn
              size={SIZE_1}
              onClick={() => setShowProtocolSetupInfo(false)}
            >
              <Icon name="chevron-up" color={C_MED_DARK_GRAY} />
            </Btn>
          </Flex>
          <Flex
            id={`RunDetails_ProtocolSetup_CommandList`}
            flexDirection={DIRECTION_COLUMN}
          >
            {protocolSetupCommandList?.map(command => {
              return (
                <ProtocolSetupInfo
                  key={command.id}
                  setupCommand={command as RunTimeCommand}
                />
              )
            })}
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