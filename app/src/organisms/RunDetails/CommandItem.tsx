import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  DIRECTION_ROW,
  Flex,
  C_DARK_GRAY,
  COLOR_ERROR,
  FONT_SIZE_BODY_1,
  C_NEAR_WHITE,
  C_AQUAMARINE,
  C_MINT,
  SPACING_2,
  C_ERROR_LIGHT,
  C_POWDER_BLUE,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  FONT_SIZE_CAPTION,
  FONT_WEIGHT_BOLD,
  Icon,
  SPACING_1,
  SPACING_3,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import { css } from 'styled-components'
import { CommandTimer } from './CommandTimer'
import { CommandText } from './CommandText'
import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import { useCommandQuery } from '@opentrons/react-api-client'
import { useCurrentRunId } from '../ProtocolUpload/hooks/useCurrentRunId'
import type { RunStatus, RunCommandSummary } from '@opentrons/api-client'

import type {
  Command,
  CommandStatus,
} from '@opentrons/shared-data/protocol/types/schemaV6/command'

const PLACEHOLDERTIMER = '00:00:00' //  TODO: immediately wire up the timer

export type Status = 'queued' | 'running' | 'succeeded' | 'failed'

interface CommandItemsProps {
  runStatus?: RunStatus
  currentCommand: Command | RunCommandSummary

  commandText?: JSX.Element
}
function CommandItemRunning(props: CommandItemsProps): JSX.Element {
  const { currentCommand, runStatus } = props
  const { t } = useTranslation('run_details')
  return (
    <Flex flexDirection={DIRECTION_ROW}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex
          fontWeight={FONT_WEIGHT_BOLD}
          marginBottom={SPACING_1}
          marginTop={SPACING_1}
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          fontSize={FONT_SIZE_CAPTION}
        >
          {runStatus === 'paused' ? t('current_step_pause') : t('current_step')}
        </Flex>
        <CommandTimer
          start={PLACEHOLDERTIMER}
          timer={PLACEHOLDERTIMER}
          end={PLACEHOLDERTIMER}
          runStatus={props.runStatus}
        />
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <CommandText command={currentCommand} commandText={props.commandText} />
        {runStatus === 'paused' ? (
          <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
            <Flex
              marginTop={SPACING_1}
              marginBottom={SPACING_1}
              marginRight={SPACING_1}
              marginLeft={SPACING_3}
              width={SPACING_3}
            >
              <Icon name="pause" />
            </Flex>
            <Flex>{t('pause_protocol')}</Flex>
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  )
}

function CommandItemQueued(props: CommandItemsProps): JSX.Element {
  const { currentCommand } = props
  return (
    <Flex marginLeft={SPACING_1} key={currentCommand.id}>
      {props.commandText}
    </Flex>
  )
}

function CommandItemSuccess(props: CommandItemsProps): JSX.Element {
  const { currentCommand } = props
  return (
    <Flex flexDirection={DIRECTION_ROW}>
      <CommandTimer start={PLACEHOLDERTIMER} end={PLACEHOLDERTIMER} />
      <CommandText command={currentCommand} commandText={props.commandText} />
    </Flex>
  )
}

function CommandItemFailed(props: CommandItemsProps): JSX.Element {
  const { currentCommand } = props
  const { t } = useTranslation('run_details')
  return (
    <Flex flexDirection={DIRECTION_ROW}>
      <CommandTimer start={PLACEHOLDERTIMER} end={PLACEHOLDERTIMER} />
      <Flex flexDirection={DIRECTION_ROW} color={COLOR_ERROR}>
        <Flex margin={SPACING_1} width={SPACING_3}>
          <Icon name="information" />
        </Flex>
        <Flex alignItems={ALIGN_CENTER}>{t('step_failed')}</Flex>
      </Flex>
      <CommandText command={currentCommand} commandText={props.commandText} />
    </Flex>
  )
}

export interface CommandItemProps {
  currentCommand: Command | RunCommandSummary
  runStatus?: RunStatus
}

const WRAPPER_STYLE_BY_STATUS: {
  [status in CommandStatus]: { border: string; backgroundColor: string }
} = {
  queued: { border: 'none', backgroundColor: C_NEAR_WHITE },
  running: {
    border: `1px solid ${C_MINT}`,
    backgroundColor: C_POWDER_BLUE,
  },
  succeeded: {
    border: 'none',
    backgroundColor: C_AQUAMARINE,
  },
  failed: {
    border: `1px solid ${COLOR_ERROR}`,
    backgroundColor: C_ERROR_LIGHT,
  },
}
export function CommandItem(props: CommandItemProps): JSX.Element {
  const { t } = useTranslation('run_details')
  const { currentCommand, runStatus } = props
  const commandStatus =
    runStatus !== RUN_STATUS_IDLE && currentCommand.status != null
      ? currentCommand.status
      : 'queued'

  const currentRunId = useCurrentRunId()
  const {
    data: commandDetails,
    refetch: refetchCommandDetails,
  } = useCommandQuery(currentRunId, currentCommand.id)

  React.useEffect(() => {
    refetchCommandDetails()
  }, [commandStatus])

  const WRAPPER_STYLE = css`
    font-size: ${FONT_SIZE_BODY_1};
    background-color: ${WRAPPER_STYLE_BY_STATUS[commandStatus].backgroundColor};
    border: ${WRAPPER_STYLE_BY_STATUS[commandStatus].border};
    padding: ${SPACING_2};
    color: ${C_DARK_GRAY};
    flex-direction: ${DIRECTION_ROW};
  `
  let commandTextNode
  if (currentCommand.commandType === 'delay') {
    commandTextNode = (
      <Flex>
        <Flex
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          padding={SPACING_1}
          key={currentCommand.id}
          id={`RunDetails_CommandList`}
        >
          {t('comment')}
        </Flex>
        {commandDetails != null ? (
          <Flex>{commandDetails?.data?.result}</Flex>
        ) : null}
      </Flex>
    )
  } else if (currentCommand.commandType === 'pickUpTip') {
    commandTextNode = (
      <Flex key={currentCommand.id}>
        <Trans
          t={t}
          i18nKey={'pickup_tip'}
          values={{
            // @ts-expect-error  - data doesn't exit on type params, wait until command type is updated
            location: currentCommand.params.wellName,
          }}
        />
      </Flex>
    )
  } else if (currentCommand.commandType === 'custom') {
    commandTextNode = (
      <Flex key={currentCommand.id}>
        {/* @ts-expect-error  - data doesn't exit on type params, wait until command type is updated */}
        {currentCommand?.params?.legacyCommandText ??
          currentCommand.commandType}
      </Flex>
    )
  }

  let contents
  if (commandStatus === 'running') {
    contents = (
      <CommandItemRunning
        runStatus={runStatus}
        currentCommand={currentCommand}
        commandText={commandTextNode}
      />
    )
  } else if (commandStatus === 'failed') {
    contents = (
      <CommandItemFailed
        currentCommand={currentCommand}
        commandText={commandTextNode}
      />
    )
  } else if (commandStatus === 'queued') {
    contents = (
      <CommandItemQueued
        currentCommand={currentCommand}
        commandText={commandTextNode}
      />
    )
  } else if (commandStatus === 'succeeded') {
    contents = (
      <CommandItemSuccess
        currentCommand={currentCommand}
        commandText={commandTextNode}
      />
    )
  }
  return <Flex css={WRAPPER_STYLE}>{contents}</Flex>
}
