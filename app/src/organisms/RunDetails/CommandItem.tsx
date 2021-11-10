import * as React from 'react'
import { useTranslation } from 'react-i18next'
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
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6/command'

const PLACEHOLDERTIMER = '00:00:00' //  TODO: immediately wire up the timer

export type Status = 'queued' | 'running' | 'succeeded' | 'failed'

interface CommandItemsProps {
  runStatus?: string
  currentCommand: Command
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
          runStatus={'paused'}
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
    <Flex>
      <Flex>{currentCommand.commandType} </Flex>
      <Flex marginLeft={SPACING_1}>{props.commandText}</Flex>
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
  currentCommand: Command
  type: Status
  runStatus?: string
  commandText?: JSX.Element
}

const WRAPPER_STYLE_BY_STATUS: Record<
  Status,
  { border: string; backgroundColor: string }
> = {
  queued: { border: 'no-border', backgroundColor: C_NEAR_WHITE },
  running: {
    border: `1px solid ${C_MINT}`,
    backgroundColor: C_POWDER_BLUE,
  },
  succeeded: {
    border: 'no-border',
    backgroundColor: C_AQUAMARINE,
  },
  failed: {
    border: `1px solid ${COLOR_ERROR}`,
    backgroundColor: C_ERROR_LIGHT,
  },
}
export function CommandItem(props: CommandItemProps): JSX.Element {
  const { currentCommand, runStatus, type, commandText } = props

  const WRAPPER_STYLE = css`
    font-size: ${FONT_SIZE_BODY_1};
    background-color: ${WRAPPER_STYLE_BY_STATUS[type].backgroundColor};
    border: ${WRAPPER_STYLE_BY_STATUS[type].border};
    padding: ${SPACING_2};
    color: ${C_DARK_GRAY};
    flex-direction: ${DIRECTION_ROW};
  `
  let commandStatus
  if (type === 'running') {
    commandStatus = (
      <CommandItemRunning
        runStatus={runStatus}
        currentCommand={currentCommand}
        commandText={commandText}
      />
    )
  } else if (type === 'failed') {
    commandStatus = (
      <CommandItemFailed
        currentCommand={currentCommand}
        commandText={commandText}
      />
    )
  } else if (type === 'queued') {
    commandStatus = (
      <CommandItemQueued
        currentCommand={currentCommand}
        commandText={commandText}
      />
    )
  } else if (type === 'succeeded') {
    commandStatus = (
      <CommandItemSuccess
        currentCommand={currentCommand}
        commandText={commandText}
      />
    )
  }
  return <Flex css={WRAPPER_STYLE}>{commandStatus}</Flex>
}
