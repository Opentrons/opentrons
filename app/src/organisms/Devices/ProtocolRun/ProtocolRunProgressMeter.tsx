import * as React from 'react'
import last from 'lodash/last'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { RunProgressMeter } from '../RunProgressMeter'

const MIN_AGGREGATION_PERCENT = 8
const TICKED_COMMAND_TYPES = ['waitForResume', 'moveLabware']

interface ProtocolRunProgressMeterProps {
  runId: string
  makeHandleJumpToStep: (index: number) => () => void
}
export function ProtocolRunProgressMeter(props: ProtocolRunProgressMeterProps) {
  const {runId, makeHandleJumpToStep} = props
  const robotSideAnalysis = useMostRecentCompletedAnalysis(runId)
  const analysisCommands = robotSideAnalysis?.commands ?? []
  const commandBufferCount = analysisCommands.length * 0.01 * MIN_AGGREGATION_PERCENT
  const ticks = analysisCommands.reduce<Array<{ index: number, count: number }>>((acc, c, index) => {
    if (TICKED_COMMAND_TYPES.includes(c.commandType)) {
      const mostRecentTick = last(acc)
      if (mostRecentTick == null) {
        return [...acc, { index, count: 1 }]
      } else if ((index - mostRecentTick.index) > commandBufferCount) {
        return [...acc, { index, count: 1 }]
      } else {
        return [...acc.slice(0, -1), { index: mostRecentTick.index, count: mostRecentTick.count + 1 }]
      }
    }
    return acc
  }, [])

  return <RunProgressMeter {...{ ticks, makeHandleJumpToStep, analysisCommands }} currentRunCommandIndex={1100} />
}
