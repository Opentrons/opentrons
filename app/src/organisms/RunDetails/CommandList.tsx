import dropWhile from 'lodash/dropWhile'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  TEXT_TRANSFORM_UPPERCASE,
  FONT_SIZE_CAPTION,
  SPACING_1,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  Btn,
  SIZE_1,
  C_MED_DARK_GRAY,
  FONT_HEADER_DARK,
  JUSTIFY_START,
  Text,
  SPACING_2,
  C_NEAR_WHITE,
  TEXT_TRANSFORM_CAPITALIZE,
  AlertItem,
  Box,
  PrimaryBtn,
} from '@opentrons/components'
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
import type { RunCommandSummary } from '@opentrons/api-client'

const WINDOW_SIZE = 200
const WINDOW_OVERLAP = 100

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
  if (runStatus === 'stop-requested' || runStatus === 'stopped') {
    alertItemTitle = t('protocol_run_canceled')
  }
  if (runStatus === 'succeeded') {
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
      if (scrollTop + clientHeight === scrollHeight) {
        const potentialNextWindowFirstIndex =
          firstIndexInWindow + WINDOW_OVERLAP
        if (potentialNextWindowFirstIndex < currentCommandList.length) {
          setWindowIndex(windowIndex + 1)
        }
      } else if (scrollTop === 0) {
        const potentialPrevWindowFirstIndex =
          firstIndexInWindow - WINDOW_OVERLAP
        if (windowIndex > 0 && potentialPrevWindowFirstIndex >= 0) {
          setWindowIndex(windowIndex - 1)
          listInnerRef.current?.scrollTo({ top: 1 })
        }
      }
    }
  }

  return (
    <Box
      height="calc(100vh - 3.5rem)"
      width="100%"
      ref={listInnerRef}
      onScroll={onScroll}
      overflowY="scroll"
    >
      <Flex flexDirection={DIRECTION_COLUMN} paddingLeft={SPACING_2}>
        {isFirstWindow ? (
          <>
            {['failed', 'succeeded', 'stop-requested', 'stopped'].includes(runStatus) ? (
              <Box padding={`${SPACING_2} ${SPACING_2} ${SPACING_2} 0`}>
                <AlertItem
                  type={['stop-requested', 'failed', 'stopped'].includes(runStatus) ? 'error' : 'success'}
                  title={alertItemTitle}
                />
              </Box>
            ) : null}
            <Text
              paddingY={SPACING_2}
              css={FONT_HEADER_DARK}
              textTransform={TEXT_TRANSFORM_CAPITALIZE}
            >
              {t('protocol_steps')}
            </Text>
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
              >
                <Flex
                  paddingY={SPACING_1}
                  paddingRight={SPACING_2}
                  flexDirection={DIRECTION_COLUMN}
                >
                  <CommandItem
                    analysisCommand={command.analysisCommand}
                    runCommandSummary={command.runCommandSummary}
                    runStatus={runStatus}
                    currentRunId={runRecord?.data.id ?? null}
                    stepNumber={index + windowFirstIndex + 1}
                  />
                </Flex>
                {showAnticipatedStepsTitle && (
                  <Text fontSize={FONT_SIZE_CAPTION} paddingY={SPACING_1}>
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
    <Flex marginY={SPACING_1}>
      {showProtocolSetupInfo ? (
        <React.Fragment>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            flex={'auto'}
            backgroundColor={C_NEAR_WHITE}
          >
            <Flex
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              color={C_MED_DARK_GRAY}
              padding={SPACING_2}
            >
              <Text
                textTransform={TEXT_TRANSFORM_UPPERCASE}
                fontSize={FONT_SIZE_CAPTION}
                id={`RunDetails_ProtocolSetupTitle`}
              >
                {t('protocol_setup')}
              </Text>
              <Btn
                size={SIZE_1}
                onClick={() => setShowProtocolSetupInfo(false)}
              >
                <Icon
                  name="chevron-up"
                  color={C_MED_DARK_GRAY}
                ></Icon>
              </Btn>
            </Flex>
            <Flex
              id={`RunDetails_ProtocolSetup_CommandList`}
              flexDirection={DIRECTION_COLUMN}
              marginLeft={SPACING_1}
              paddingLeft={SPACING_2}
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
        </React.Fragment>
      ) : (
        <Btn
          width={'100%'}
          role={'link'}
          onClick={() => setShowProtocolSetupInfo(true)}
          paddingRight={SPACING_1}
        >
          <Flex
            fontSize={FONT_SIZE_CAPTION}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            color={C_MED_DARK_GRAY}
            backgroundColor={C_NEAR_WHITE}
            marginRight={SPACING_1}
          >
            <Flex padding={SPACING_2}>{t('protocol_setup')}</Flex>
            <Flex>
              <Icon name={'chevron-left'} width={SIZE_1} />
            </Flex>
          </Flex>
        </Btn>
      )}
    </Flex>
  )
}