import * as React from 'react'
import {
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
import last from 'lodash/last'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { RunProgressMeter } from '../RunProgressMeter'
import { useRunStatus } from '../../RunTimeControl/hooks'
import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import { StyledText } from '../../../atoms/text'
import { useTranslation } from 'react-i18next'
import { AnalysisStepText } from '../../AnalysisStepText'
import { useCurrentRunCommandKey } from '../hooks/useCurrentRunCommandKey'

import type { RunStatus } from '@opentrons/api-client'


const TERMINAL_RUN_STATUSES: RunStatus[] = [RUN_STATUS_STOPPED, RUN_STATUS_FINISHING, RUN_STATUS_FAILED, RUN_STATUS_SUCCEEDED]
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
  const currentCommandKey = useCurrentRunCommandKey(runId)
  const analysis = useMostRecentCompletedAnalysis(runId)
  const analysisCommands = analysis?.commands ?? []
  const currentRunCommandIndex = runStatus === RUN_STATUS_SUCCEEDED
    ? analysisCommands.length
    : analysisCommands.findIndex(c => c.key === currentCommandKey) ?? 0
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
  if (currentRunCommandIndex >= 0 && currentRunCommandIndex <= analysisCommands.length - 1) {
    countOfTotalText = ` ${currentRunCommandIndex + 1}/${analysisCommands.length}`
  } else if (analysis == null) {
    countOfTotalText = '?/?'
  }

  let currentStepContents: React.ReactNode = null
  if (analysis != null && analysisCommands[currentRunCommandIndex] != null) {
    currentStepContents = (
      <AnalysisStepText
        robotSideAnalysis={analysis}
        command={analysisCommands[currentRunCommandIndex]}
      />
    )
  } else if (runStatus === RUN_STATUS_IDLE && analysisCommands[currentRunCommandIndex] == null) {
    currentStepContents = <StyledText as="h2">{t('not_started_yet')}</StyledText>
  } else if (runStatus != null && TERMINAL_RUN_STATUSES.includes(runStatus)) {
    currentStepContents = <StyledText as="h2">{t('protocol_completed')}</StyledText>
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Flex gridGap={SPACING.spacing3}>
          <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>{`${t(
            'current_step'
          )}${countOfTotalText}: `}</StyledText>
          {currentStepContents}
        </Flex>
      </Flex>
      {analysis != null ?
        <RunProgressMeter
          {...{
            ticks,
            makeHandleJumpToStep,
            analysisCommands,
            currentRunCommandIndex,
          }}
        />
        : null
      }
    </Flex>
  )
}
