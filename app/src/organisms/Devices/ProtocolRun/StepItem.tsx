import * as React from 'react'
import { useTranslation } from 'react-i18next'
import isEqual from 'lodash/isEqual'
import { css } from 'styled-components'

import {
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_PAUSED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
} from '@opentrons/api-client'
import {
  Flex,
  Icon,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  FONT_SIZE_BODY_1,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_2,
  TEXT_TRANSFORM_UPPERCASE,
  BORDERS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
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
  runStartedAt: string | null
  isMostRecentCommand: boolean
}

const WRAPPER_STYLE_BY_STATUS: {
  [status in CommandStatus]: {
    border: string
    borderRadius?: string
    backgroundColor: string
    color: string
  }
} = {
  queued: {
    border: 'none',
    backgroundColor: COLORS.background,
    color: COLORS.darkBlack,
  },
  running: {
    border: `1px solid ${COLORS.blue}`,
    borderRadius: BORDERS.radiusSoftCorners,
    backgroundColor: COLORS.lightBlue,
    color: COLORS.darkBlack,
  },
  succeeded: {
    border: 'none',
    backgroundColor: COLORS.background,
    color: COLORS.darkGreyEnabled,
  },
  failed: {
    border: `1px solid ${COLORS.error}`,
    borderRadius: BORDERS.radiusSoftCorners,
    backgroundColor: COLORS.errorBg,
    color: COLORS.darkBlack,
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

  const isPause =
    analysisCommand?.commandType === 'pause' ||
    runCommandSummary?.commandType === 'pause'

  const WRAPPER_STYLE = css`
    font-size: ${FONT_SIZE_BODY_1};
    background-color: ${WRAPPER_STYLE_BY_STATUS[commandStatus].backgroundColor};
    border: ${WRAPPER_STYLE_BY_STATUS[commandStatus].border};
    border-radius: ${WRAPPER_STYLE_BY_STATUS[commandStatus].borderRadius};
    padding: ${SPACING.spacing3};
    color: ${WRAPPER_STYLE_BY_STATUS[commandStatus].color};
    flex-direction: ${DIRECTION_COLUMN};
    width: 100%;
  `
  return (
    <Flex alignItems={ALIGN_CENTER} flexDirection={DIRECTION_ROW}>
      <StyledText fontSize={TYPOGRAPHY.fontSizeCaption} width={SIZE_2}>
        {stepNumber}
      </StyledText>
      <Flex css={WRAPPER_STYLE}>
        {commandStatus === 'running' ? (
          <CurrentCommandLabel runStatus={runStatus} />
        ) : null}
        {commandStatus === 'failed' ? <CommandFailedMessage /> : null}
        {isComment ? (
          <Flex
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            fontSize={TYPOGRAPHY.fontSizeCaption}
            color={COLORS.darkGreyEnabled}
            marginBottom={SPACING.spacing2}
          >
            {t('comment_step')}
          </Flex>
        ) : null}
        {isPause ? (
          <Flex
            textTransform={TEXT_TRANSFORM_UPPERCASE}
            fontSize={TYPOGRAPHY.fontSizeCaption}
            color={COLORS.darkGreyEnabled}
            marginBottom={SPACING.spacing2}
          >
            <Icon
              name="pause"
              width={SPACING.spacing4}
              marginRight={SPACING.spacing3}
              color={COLORS.darkGreyEnabled}
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
            {!isComment ? (
              <StepTimer
                commandStartedAt={runCommandSummary?.startedAt ?? null}
                commandCompletedAt={runCommandSummary?.completedAt ?? null}
                runStartedAt={runStartedAt}
              />
            ) : null}
            <StepText
              analysisCommand={analysisCommand}
              robotName={robotName}
              runCommand={runCommandSummary}
              runId={runId}
            />
          </Flex>
          {/* TODO(bh, 2022-03-24): expandable step (UI polish) */}
        </Flex>
      </Flex>
    </Flex>
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
    <StyledText
      fontWeight={TYPOGRAPHY.fontWeightBold}
      marginBottom={SPACING.spacing2}
      marginTop={SPACING.spacing2}
      textTransform={TEXT_TRANSFORM_UPPERCASE}
      fontSize={TYPOGRAPHY.fontSizeCaption}
    >
      {getCommandTypeLabel()}
    </StyledText>
  )
}

function CommandFailedMessage(): JSX.Element {
  const { t } = useTranslation('run_details')
  return (
    <Flex flexDirection={DIRECTION_ROW} color={COLORS.error}>
      <Flex margin={SPACING.spacing2} width={SPACING.spacing4}>
        <Icon name="information" />
      </Flex>
      <Flex alignItems={ALIGN_CENTER}>{t('step_failed')}</Flex>
    </Flex>
  )
}
