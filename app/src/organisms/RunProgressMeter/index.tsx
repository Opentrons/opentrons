import * as React from 'react'
import { useTranslation } from 'react-i18next'
import last from 'lodash/last'
import { css } from 'styled-components'
import {
  COLORS,
  BORDERS,
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'
import {
  RUN_STATUS_IDLE,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { StyledText } from '../../atoms/text'
import { CommandText } from '../CommandText'
import { useRunStatus } from '../RunTimeControl/hooks'
import { ProgressBar } from '../../atoms/ProgressBar'
import { useLastRunCommandKey } from '../Devices/hooks/useLastRunCommandKey'
import { Tick } from './Tick'

import type { RunStatus } from '@opentrons/api-client'

const TERMINAL_RUN_STATUSES: RunStatus[] = [
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_SUCCEEDED,
]
// percent of the entire analysis that two individual
// ticks could appear within before being grouped
const MIN_AGGREGATION_PERCENT = 0.6
const TICKED_COMMAND_TYPES = ['waitForResume', 'moveLabware']

interface ProtocolRunProgressMeterProps {
  runId: string
  makeHandleJumpToStep: (index: number) => () => void
}
export function ProtocolRunProgressMeter(
  props: ProtocolRunProgressMeterProps
): JSX.Element {
  const { runId, makeHandleJumpToStep } = props
  const { t } = useTranslation('run_details')
  const runStatus = useRunStatus(runId)
  const lastRunCommandKey = useLastRunCommandKey(runId)
  const analysis = useMostRecentCompletedAnalysis(runId)
  const analysisCommands = analysis?.commands ?? []

  /**
   * if it exists, find the command within the analysis
   * that has the same commandKey as the most recent 
   * command from the run record. NOTE: the most recent
   * command may not always be "current", for instance if 
   * the run has completed/failed there will be no current command */ 
  const lastRunCommandIndex =
    analysisCommands.findIndex(c => c.key === lastRunCommandKey) ?? 0
  const commandAggregationCount =
    analysisCommands.length > 100
      ? analysisCommands.length * 0.01 * MIN_AGGREGATION_PERCENT
      : 0
  const ticks = analysisCommands.reduce<
    Array<{ index: number; count: number; range: number }>
  >((acc, c, index) => {
    if (TICKED_COMMAND_TYPES.includes(c.commandType)) {
      const mostRecentTick = last(acc)
      if (mostRecentTick == null) {
        return [...acc, { index, count: 1, range: 1 }]
      } else if (index - mostRecentTick.index > commandAggregationCount) {
        return [...acc, { index, count: 1, range: 1 }]
      } else {
        return [
          ...acc.slice(0, -1),
          {
            index: mostRecentTick.index,
            count: mostRecentTick.count + 1,
            range: index - mostRecentTick.index,
          },
        ]
      }
    }
    return acc
  }, [])
  let countOfTotalText = ''
  if (
    lastRunCommandIndex >= 0 &&
    lastRunCommandIndex <= analysisCommands.length - 1
  ) {
    countOfTotalText = ` ${lastRunCommandIndex + 1}/${analysisCommands.length}`
  } else if (analysis == null) {
    countOfTotalText = '?/?'
  }

  let currentStepContents: React.ReactNode = null
  if (analysis != null && analysisCommands[lastRunCommandIndex] != null) {
    currentStepContents = (
      <CommandText
        robotSideAnalysis={analysis}
        command={analysisCommands[lastRunCommandIndex]}
      />
    )
  } else if (
    runStatus === RUN_STATUS_IDLE &&
    analysisCommands[lastRunCommandIndex] == null
  ) {
    currentStepContents = (
      <StyledText as="h2">{t('not_started_yet')}</StyledText>
    )
  } else if (runStatus != null && TERMINAL_RUN_STATUSES.includes(runStatus)) {
    currentStepContents = (
      <StyledText as="h2">{t('protocol_completed')}</StyledText>
    )
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Flex gridGap={SPACING.spacing3}>
          <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>{`${t(
            'current_step'
          )} ${countOfTotalText}${currentStepContents != null ? ': ' : ''
            }`}</StyledText>
          {currentStepContents}
        </Flex>
      </Flex>
      {analysis != null ? (

        <ProgressBar
          percentComplete={
            lastRunCommandIndex > 0
              ? ((lastRunCommandIndex + 1) / analysisCommands.length) * 100
              : 0
          }
          outerStyles={css`
            height: 0.375rem;
            background-color: ${COLORS.medGreyEnabled};
            border-radius: ${BORDERS.radiusSoftCorners};
            position: relative;
            overflow: initial;
          `}
          innerStyles={css`
            height: 0.375rem;
            background-color: ${COLORS.darkBlackEnabled};
            border-radius: ${BORDERS.radiusSoftCorners};
          `}
        >

          {ticks.map(tick => (
            <Tick
              key={tick.index}
              {...{
                ...tick,
                makeHandleJumpToStep,
                firstCommandType: analysisCommands[tick.index]?.commandType,
              }}
              total={analysisCommands.length}
            />
          ))}
        </ProgressBar>
      ) : null}
    </Flex>
  )
}
