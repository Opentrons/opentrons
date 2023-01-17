import * as React from 'react'
import { RunTimeCommand } from '@opentrons/shared-data'
import {
  Flex,
  useHoverTooltip,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  COLORS,
} from '@opentrons/components'

import { Tooltip } from '../../../atoms/Tooltip'
import { Portal } from '../../../App/portal'

interface RunProgressMeterProps {
  analysisCommands: RunTimeCommand[]
  ticks: Array<{ index: number, count: number }>
  makeHandleJumpToStep: (i: number) => () => void
  currentRunCommandIndex: number
}

export function RunProgressMeter(props: RunProgressMeterProps) {
  const { ticks, analysisCommands, makeHandleJumpToStep, currentRunCommandIndex } = props
  console.log('AL', analysisCommands.length)
  console.log('CRCI',currentRunCommandIndex)
  return (
    <Flex flexDirection={DIRECTION_COLUMN} width="100%">
      <Flex width="100%" height="6px" borderRadius="3px" backgroundColor={COLORS.medGreyEnabled} />
      <Flex marginTop="-6px" width={`${((currentRunCommandIndex + 1) / analysisCommands.length) * 100}%`} height="6px" borderRadius="3px" backgroundColor={COLORS.darkBlackEnabled} />
      <Flex marginTop="-10px" width="100%">
        {ticks.map((tick) => (
          <Tick {...{ ...tick, makeHandleJumpToStep }} total={analysisCommands.length} />
        ))}
      </Flex>
    </Flex>
  )
}

function Tick(props: { index: number, count: number, makeHandleJumpToStep: (i: number) => () => void, total: number }) {
  const { index, count, makeHandleJumpToStep, total } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  const isAggregatedTick = count > 1
  const width = isAggregatedTick ? 11.156 : 4
  return (
    <Flex
      {...targetProps}
      cursor="pointer"
      onClick={makeHandleJumpToStep(index)}
      backgroundColor={COLORS.white}
      fontSize="9px"
      borderRadius="4px"
      border={`${COLORS.blueEnabled} 1px solid`}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      height="13px"
      padding="2px"
      position="absolute"
      left={`calc(${((index + 1) / total) * 100}% - 2rem + 1px - ${(isAggregatedTick ? 13.156 : 6)}px)`}
    >
      {isAggregatedTick ? count : null}
      <Portal><Tooltip tooltipProps={tooltipProps}>{count}</Tooltip></Portal>
    </Flex>
  )
}