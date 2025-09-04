import min from 'lodash/min'

import { linearInterpolate } from '@opentrons/shared-data'

import type { LiquidHandlingPropertyByVolume } from '@opentrons/shared-data'

// export const getFlowRateFields = (
//   volume: number,
//   flowRateByVolume: LiquidHandlingPropertyByVolume,
//   liquidHandlingAction: 'aspirate' | 'dispense' | 'all'
//   hardwareMaximum: number | null = null
// ): Record<string, number | null> => {
//   const interpolatedFlowRate = linearInterpolate(
//     volume,
//     flowRateByVolume as Array<[number, number]>
//   )
//   return {
//     [`${liquidHandlingAction}_flowRate`]: interpolatedFlowRate,
//   }
// }

export const getFlowRateFields = (
  volume: number,
  flowRateByVolume: LiquidHandlingPropertyByVolume,
  liquidHandlingAction: 'aspirate' | 'dispense' | 'all',
  hardwareMaximum: number | null = null
): Record<string, number | null> => {
  const interpolatedFlowRate = linearInterpolate(
    volume,
    flowRateByVolume as Array<[number, number]>
  )
  return {
    [`${liquidHandlingAction}_flowRate`]:
      hardwareMaximum != null
        ? min([interpolatedFlowRate, hardwareMaximum]) ?? null
        : interpolatedFlowRate,
  }
}
