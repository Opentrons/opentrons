import * as React from 'react'
import isEqual from 'lodash/isEqual'
import { useTranslation } from 'react-i18next'
import { useInView } from 'react-intersection-observer'
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
  C_MED_DARK_GRAY,
} from '@opentrons/components'
import { useCommandQuery } from '@opentrons/react-api-client'
import { css } from 'styled-components'
import { CommandTimer } from './CommandTimer'
import { CommandText } from './CommandText'
import {
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_PAUSED,
} from '@opentrons/api-client'
import type { RunStatus, RunCommandSummary } from '@opentrons/api-client'

import type {
  Command,
  CommandStatus,
} from '@opentrons/shared-data/protocol/types/schemaV6/command'

export interface CommandItemProps {
  analysisCommand: Command | null
  runCommandSummary: RunCommandSummary | null
  runStatus: RunStatus
  currentRunId: string | null
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

const commandIsComplete = (status: RunCommandSummary['status']): boolean =>
  status === 'succeeded' || status === 'failed'

// minimum delay in MS for observer notifications
export const OBSERVER_DELAY = 300

function CommandItemComponent(props: CommandItemProps): JSX.Element | null {
  const {analysisCommand, runCommandSummary, runStatus, currentRunId} = props
  const { t } = useTranslation('run_details')
  const [commandItemRef, isInView] = useInView({
    delay: OBSERVER_DELAY,
  })
  const [staleTime, setStaleTime] = React.useState<number>(0)
  const isAnticipatedCommand =
    analysisCommand !== null && runCommandSummary === null
  const { data: commandDetails, refetch } = useCommandQuery(
    currentRunId,
    runCommandSummary?.id ?? null,
    {
      enabled: !isAnticipatedCommand && runStatus !== 'idle' && isInView,
      staleTime,
    }
  )

  React.useEffect(() => {
    if (
      commandDetails?.data.status &&
      commandIsComplete(commandDetails?.data.status) &&
      commandDetails?.data.completedAt != null
    ) {
      setStaleTime(Infinity)
    }
    if (
      commandDetails?.data.startedAt != null &&
      commandDetails?.data.completedAt == null &&
      isInView
    ) {
      refetch()
    }
  }, [runCommandSummary?.status, commandDetails?.data, refetch])
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
  } else if (
    commandDetails?.data.commandType === 'custom' &&
    'legacyCommandType' in commandDetails?.data.params
  ) {
    isComment =
      commandDetails.data.params.legacyCommandType === 'command.COMMENT'
  }

  const isPause =
    analysisCommand?.commandType === 'pause' ||
    runCommandSummary?.commandType === 'pause'

  const WRAPPER_STYLE = css`
    font-size: ${FONT_SIZE_BODY_1};
    background-color: ${WRAPPER_STYLE_BY_STATUS[commandStatus].backgroundColor};
    border: ${WRAPPER_STYLE_BY_STATUS[commandStatus].border};
    padding: ${SPACING_2};
    color: ${C_DARK_GRAY};
    flex-direction: ${DIRECTION_COLUMN};
  `
  return (
    <Flex css={WRAPPER_STYLE} ref={commandItemRef}>
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
          marginLeft={SPACING_1}
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
          marginLeft={SPACING_1}
        >
          <Icon
            name="pause"
            width={SPACING_3}
            paddingRight={SPACING_2}
            color={C_DARK_GRAY}
          />
          {t('pause_protocol')}
        </Flex>
      ) : null}
      <Flex flexDirection={DIRECTION_ROW}>
        {['running', 'failed', 'succeeded'].includes(commandStatus) &&
        !isComment ? (
          <CommandTimer
            commandStartedAt={commandDetails?.data.startedAt}
            commandCompletedAt={commandDetails?.data.completedAt}
          />
        ) : null}
        <CommandText
          analysisCommand={analysisCommand}
          runCommand={commandDetails?.data ?? null}
        />
      </Flex>
    </Flex>
  )
}

export const CommandItem = React.memo(
  CommandItemComponent,
  (prevProps, nextProps) => {
    const shouldRerender = !isEqual(prevProps.analysisCommand, nextProps.analysisCommand)
      || !isEqual(prevProps.runCommandSummary, nextProps.runCommandSummary)
      || (
        (([RUN_STATUS_PAUSED, RUN_STATUS_PAUSE_REQUESTED] as RunStatus[]).includes(nextProps.runStatus)
        || ([RUN_STATUS_PAUSED, RUN_STATUS_PAUSE_REQUESTED] as RunStatus[]).includes(prevProps.runStatus)) &&
        (prevProps.runCommandSummary?.status === 'running'
        || nextProps.runCommandSummary?.status === 'running')
      )
    return !shouldRerender
  }
)

interface CurrentCommandLabelProps {
  runStatus?: RunStatus
}

function CurrentCommandLabel(props: CurrentCommandLabelProps): JSX.Element {
  const { t } = useTranslation('run_details')
  return (
    <Text
      fontWeight={FONT_WEIGHT_BOLD}
      marginBottom={SPACING_1}
      marginTop={SPACING_1}
      textTransform={TEXT_TRANSFORM_UPPERCASE}
      fontSize={FONT_SIZE_CAPTION}
    >
      {props.runStatus === RUN_STATUS_PAUSED ||
      props.runStatus === RUN_STATUS_PAUSE_REQUESTED
        ? t('current_step_pause')
        : t('current_step')}
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
