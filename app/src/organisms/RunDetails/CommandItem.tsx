import * as React from 'react'
import isEqual from 'lodash/isEqual'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_ROW,
  Flex,
  Text,
  C_DARK_GRAY,
  COLOR_ERROR,
  FONT_SIZE_BODY_1,
  C_NEAR_WHITE,
  C_AQUAMARINE,
  C_MINT,
  C_ERROR_LIGHT,
  C_POWDER_BLUE,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  FONT_SIZE_CAPTION,
  FONT_WEIGHT_BOLD,
  Icon,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  TEXT_TRANSFORM_UPPERCASE,
  C_MED_DARK_GRAY,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
} from '@opentrons/components'
import { css } from 'styled-components'
import { CommandTimer } from './CommandTimer'
import { CommandText } from './CommandText'
import {
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_PAUSED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
} from '@opentrons/api-client'
import type { RunStatus, RunCommandSummary } from '@opentrons/api-client'

import type {
  RunTimeCommand,
  CommandStatus,
} from '@opentrons/shared-data/protocol/types/schemaV6/command'

export interface CommandItemProps {
  analysisCommand: RunTimeCommand | null
  runCommandSummary: RunCommandSummary | null
  runStatus: RunStatus
  stepNumber: number
  runStartedAt: string | null
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

export function CommandItemComponent(
  props: CommandItemProps
): JSX.Element | null {
  const {
    analysisCommand,
    runCommandSummary,
    runStatus,
    stepNumber,
    runStartedAt,
  } = props
  const { t } = useTranslation('run_details')

  const commandStatus =
    runStatus !== RUN_STATUS_IDLE && runCommandSummary?.status != null
      ? runCommandSummary.status
      : 'queued'

  let isComment = false
  if (
    analysisCommand != null &&
    'params' in analysisCommand &&
    'legacyCommandType' in analysisCommand.params
  ) {
    isComment = analysisCommand?.params.legacyCommandType === 'command.COMMENT'
  } else if (
    runCommandSummary != null &&
    runCommandSummary.result != null &&
    'legacyCommandType' in runCommandSummary.result
  ) {
    isComment = runCommandSummary.result.legacyCommandType === 'command.COMMENT'
  }

  const isPause =
    analysisCommand?.commandType === 'pause' ||
    runCommandSummary?.commandType === 'pause'
  const backgroundColor =
    commandStatus === 'queued' && runCommandSummary != null
      ? C_AQUAMARINE
      : WRAPPER_STYLE_BY_STATUS[commandStatus].backgroundColor

  const WRAPPER_STYLE = css`
    font-size: ${FONT_SIZE_BODY_1};
    background-color: ${backgroundColor};
    border: ${WRAPPER_STYLE_BY_STATUS[commandStatus].border};
    padding: ${SPACING_2};
    color: ${C_DARK_GRAY};
    flex-direction: ${DIRECTION_COLUMN};
  `
  return (
    <Flex css={WRAPPER_STYLE}>
      {commandStatus === 'running' ? (
        <CurrentCommandLabel runStatus={runStatus} />
      ) : null}
      {commandStatus === 'failed' ? <CommandFailedMessage /> : null}
      {isComment ? (
        <Flex
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          fontSize={FONT_SIZE_CAPTION}
          color={C_MED_DARK_GRAY}
          marginBottom={SPACING_1}
        >
          {t('comment_step')}
        </Flex>
      ) : null}
      {isPause ? (
        <Flex
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          fontSize={FONT_SIZE_CAPTION}
          color={C_MED_DARK_GRAY}
          marginBottom={SPACING_1}
        >
          <Icon
            name="pause"
            width={SPACING_3}
            marginRight={SPACING_2}
            color={C_DARK_GRAY}
          />
          {t('pause_protocol')}
        </Flex>
      ) : null}
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        minHeight="1.75rem"
      >
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
          <Text
            fontSize={FONT_SIZE_CAPTION}
            marginRight={SPACING_3}
            minWidth={SIZE_1}
          >
            {stepNumber}
          </Text>
          <CommandText
            analysisCommand={analysisCommand}
            runCommand={runCommandSummary}
          />
        </Flex>
        {['running', 'failed', 'succeeded'].includes(commandStatus) &&
        !isComment ? (
          <CommandTimer
            commandStartedAt={runCommandSummary?.startedAt ?? null}
            commandCompletedAt={runCommandSummary?.completedAt ?? null}
            runStartedAt={runStartedAt}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}

export const CommandItem = React.memo(
  CommandItemComponent,
  (prevProps, nextProps) => {
    const shouldRerender =
      !isEqual(prevProps.analysisCommand, nextProps.analysisCommand) ||
      !isEqual(prevProps.runCommandSummary, nextProps.runCommandSummary) ||
      ((([
        RUN_STATUS_PAUSED,
        RUN_STATUS_PAUSE_REQUESTED,
      ] as RunStatus[]).includes(nextProps.runStatus) ||
        ([
          RUN_STATUS_PAUSED,
          RUN_STATUS_PAUSE_REQUESTED,
        ] as RunStatus[]).includes(prevProps.runStatus)) &&
        (prevProps.runCommandSummary?.status === 'running' ||
          nextProps.runCommandSummary?.status === 'running'))
    return !shouldRerender
  }
)

interface CurrentCommandLabelProps {
  runStatus?: RunStatus
}

function CurrentCommandLabel(props: CurrentCommandLabelProps): JSX.Element {
  const { t } = useTranslation('run_details')
  const getCommandTypeLabel = (): string => {
    if (
      props.runStatus === RUN_STATUS_PAUSED ||
      props.runStatus === RUN_STATUS_PAUSE_REQUESTED
    ) {
      return t('current_step_pause')
    } else if (props.runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR) {
      return t('door_open_pause')
    } else {
      return t('current_step')
    }
  }
  return (
    <Text
      fontWeight={FONT_WEIGHT_BOLD}
      marginBottom={SPACING_1}
      marginTop={SPACING_1}
      textTransform={TEXT_TRANSFORM_UPPERCASE}
      fontSize={FONT_SIZE_CAPTION}
    >
      {getCommandTypeLabel()}
    </Text>
  )
}

function CommandFailedMessage(): JSX.Element {
  const { t } = useTranslation('run_details')
  return (
    <Flex flexDirection={DIRECTION_ROW} color={COLOR_ERROR}>
      <Flex margin={SPACING_1} width={SPACING_3}>
        <Icon name="information" />
      </Flex>
      <Flex alignItems={ALIGN_CENTER}>{t('step_failed')}</Flex>
    </Flex>
  )
}
