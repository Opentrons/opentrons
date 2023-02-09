import * as React from 'react'
import last from 'lodash/last'
import { Tick } from './Tick'
import type { RunTimeCommand } from '@opentrons/shared-data'

// percent of the entire analysis that two individual
// ticks could appear within before being grouped
const MIN_AGGREGATION_PERCENT = 0.6
const TICKED_COMMAND_TYPES = ['waitForResume', 'moveLabware']

interface InterventionTicksProps {
  analysisCommands: RunTimeCommand[]
  makeHandleJumpToStep: (index: number) => () => void
}
export function InterventionTicks(props: InterventionTicksProps): JSX.Element {
  const { analysisCommands, makeHandleJumpToStep } = props

  // calculate the number of adjacent commands that will appear as separate ticks
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
  return (
    <>
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
    </>
  )
}
