import * as React from 'react'
import { useTranslation } from 'react-i18next'
import isEqual from 'lodash/isEqual'
import { css } from 'styled-components'

import {
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_PAUSED,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'
import {
  Flex,
  Icon,
  useInterval,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_1,
  SIZE_2,
  BORDERS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { formatInterval } from '../../../organisms/RunTimeControl/utils'
import { StepText } from './StepText'
import { StepTimer } from './StepTimer'

import type { RunStatus, RunCommandSummary } from '@opentrons/api-client'
import type {
  RunTimeCommand,
  CommandStatus,
} from '@opentrons/shared-data/protocol/types/schemaV6/command'

export interface StepItemProps {
  analysisCommand: RunTimeCommand | null
  robotName: string
  runCommandSummary: RunCommandSummary | null
  runId: string
  runStatus: RunStatus
  stepNumber: number
  runPausedAt: string | null
  runStartedAt: string | null
  isMostRecentCommand: boolean
}

const WRAPPER_STYLE_BY_STATUS: {
  [status in CommandStatus]: {
    border: string
    backgroundColor: string
    color: string
  }
} = {
  queued: {
    border: 'none',
    backgroundColor: COLORS.background,
    color: COLORS.darkBlackEnabled,
  },
  running: {
    border: `1px solid ${COLORS.blueEnabled}`,
    backgroundColor: COLORS.lightBlue,
    color: COLORS.darkBlackEnabled,
  },
  succeeded: {
    border: 'none',
    backgroundColor: COLORS.background,
    color: COLORS.darkGreyEnabled,
  },
  failed: {
    border: `1px solid ${COLORS.errorEnabled}`,
    backgroundColor: COLORS.errorBackground,
    color: COLORS.darkBlackEnabled,
  },
}

export function StepItemComponent(props: StepItemProps): JSX.Element | null {
  const {
    analysisCommand,
    robotName,
    runCommandSummary,
    runId,
    runStatus,
    stepNumber,
    runPausedAt,
    runStartedAt,
    isMostRecentCommand,
  } = props
  const { t } = useTranslation('run_details')

  let commandStatus: RunCommandSummary['status'] = 'queued' as const
  if (runStatus !== RUN_STATUS_IDLE && runCommandSummary?.status != null) {
    commandStatus = runCommandSummary.status
  }
  if (
    isMostRecentCommand &&
    (commandStatus === 'queued' || commandStatus === 'succeeded')
  ) {
    commandStatus = 'running' as const
  }

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

  const WRAPPER_STYLE = css`
    font-size: ${TYPOGRAPHY.fontSizeP};
    background-color: ${WRAPPER_STYLE_BY_STATUS[commandStatus].backgroundColor};
    border: ${WRAPPER_STYLE_BY_STATUS[commandStatus].border};
    border-radius: ${BORDERS.radiusSoftCorners};
    padding: ${SPACING.spacing3};
    color: ${WRAPPER_STYLE_BY_STATUS[commandStatus].color};
    flex-direction: ${DIRECTION_COLUMN};
    width: 100%;
  `

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      flexDirection={DIRECTION_ROW}
      minHeight="3rem"
      width="100%"
    >
      <Flex minWidth={SIZE_2}>
        <StyledText fontSize={TYPOGRAPHY.fontSizeCaption}>
          {stepNumber}
        </StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing2}
        width="100%"
      >
        {commandStatus === 'failed' ? <CommandFailedMessage /> : null}
        <Flex css={WRAPPER_STYLE}>
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_CENTER}
          >
            <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing2}
                marginRight={SPACING.spacing3}
                minWidth="5rem"
              >
                {!isComment ? (
                  <StepTimer
                    commandStartedAt={runCommandSummary?.startedAt ?? null}
                    commandCompletedAt={runCommandSummary?.completedAt ?? null}
                    runStartedAt={runStartedAt}
                  />
                ) : (
                  <StyledText
                    as="h6"
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    textTransform={TYPOGRAPHY.textTransformUppercase}
                  >
                    {t('comment_step')}
                  </StyledText>
                )}
              </Flex>
              <Flex flexDirection={DIRECTION_COLUMN}>
                <StepText
                  analysisCommand={analysisCommand}
                  robotName={robotName}
                  runCommand={runCommandSummary}
                  runId={runId}
                />
                {runPausedAt != null && isMostRecentCommand ? (
                  <Flex alignItems={ALIGN_CENTER}>
                    <Icon
                      name="pause-circle"
                      width={SIZE_1}
                      marginRight={SPACING.spacing2}
                    />
                    <PauseTimer pausedAt={runPausedAt} />
                  </Flex>
                ) : null}
              </Flex>
            </Flex>
            {/* TODO(bh, 2022-03-24): expandable step (UI polish) */}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

interface PauseTimerProps {
  pausedAt: string
}

function PauseTimer({ pausedAt }: PauseTimerProps): JSX.Element {
  const { t } = useTranslation('run_details')

  const [now, setNow] = React.useState(Date())
  useInterval(() => setNow(Date()), 500, true)

  return (
    <StyledText>{`${t('protocol_paused_for')} ${formatInterval(
      pausedAt,
      now
    )}`}</StyledText>
  )
}

export const StepItem = React.memo(
  StepItemComponent,
  (prevProps, nextProps) => {
    const shouldRerender =
      !isEqual(prevProps.analysisCommand, nextProps.analysisCommand) ||
      !isEqual(prevProps.runCommandSummary, nextProps.runCommandSummary) ||
      !isEqual(prevProps.isMostRecentCommand, nextProps.isMostRecentCommand) ||
      ((([
        RUN_STATUS_PAUSED,
        RUN_STATUS_PAUSE_REQUESTED,
        RUN_STATUS_STOP_REQUESTED,
      ] as RunStatus[]).includes(nextProps.runStatus) ||
        ([
          RUN_STATUS_PAUSED,
          RUN_STATUS_PAUSE_REQUESTED,
          RUN_STATUS_STOP_REQUESTED,
        ] as RunStatus[]).includes(prevProps.runStatus)) &&
        (prevProps.runCommandSummary?.status === 'running' ||
          nextProps.runCommandSummary?.status === 'running'))
    return !shouldRerender
  }
)

function CommandFailedMessage(): JSX.Element {
  const { t } = useTranslation('run_details')
  return (
    <StyledText as="label" color={COLORS.errorText}>
      {t('failed_step')}
    </StyledText>
  )
}
