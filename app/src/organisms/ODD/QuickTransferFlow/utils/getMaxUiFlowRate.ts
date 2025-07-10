import round from 'lodash/round'

import type { PipetteChannels, SupportedTip } from '@opentrons/shared-data'

type FlowRateType = 'aspirate' | 'dispense' | 'blowout'

const FLEX_X_Y_MAX_SPEED = 300
const FLEX_LOW_THROUGHPUT_Z_MAX_SPEED = 100
const FLEX_HIGH_THROUGHPUT_Z_MAX_SPEED = 35
const FLEX_LOW_THROUGHPUT_PLUNGER_MAX_SPEED = 70
const FLEX_HIGH_THROUGHPUT_PLUNGER_MAX_SPEED = 15

const CHANNELS_MAPPED_TO_MAX_SPEED: Record<
  number,
  { plunger: number; x: number; y: number; z: number }
> = {
  1: {
    plunger: FLEX_LOW_THROUGHPUT_PLUNGER_MAX_SPEED,
    x: FLEX_X_Y_MAX_SPEED,
    y: FLEX_X_Y_MAX_SPEED,
    z: FLEX_LOW_THROUGHPUT_Z_MAX_SPEED,
  },
  8: {
    plunger: FLEX_LOW_THROUGHPUT_PLUNGER_MAX_SPEED,
    x: FLEX_X_Y_MAX_SPEED,
    y: FLEX_X_Y_MAX_SPEED,
    z: FLEX_LOW_THROUGHPUT_Z_MAX_SPEED,
  },
  96: {
    plunger: FLEX_HIGH_THROUGHPUT_PLUNGER_MAX_SPEED,
    x: FLEX_X_Y_MAX_SPEED,
    y: FLEX_X_Y_MAX_SPEED,
    z: FLEX_HIGH_THROUGHPUT_Z_MAX_SPEED,
  },
}

const _getPipetteAccuracyUlPerMm = (args: {
  targetVolume: number
  tipLiquidSpecs: SupportedTip
  flowRateType: Exclude<FlowRateType, 'blowout'>
}): number => {
  const { targetVolume, tipLiquidSpecs, flowRateType } = args

  const flowRateFunction = tipLiquidSpecs[flowRateType].default['1']
  let pipetteAccuracyUlPerMm = null
  for (let i = 0; i < flowRateFunction.length; i++) {
    const [x, y, z] = flowRateFunction[i]
    if (targetVolume <= x) {
      pipetteAccuracyUlPerMm = y * targetVolume + z
      return pipetteAccuracyUlPerMm
    }
  }
  const lastEntry = flowRateFunction[flowRateFunction.length - 1]
  return lastEntry[1] * targetVolume + lastEntry[2]
}

export const getMaxUiFlowRate = (args: {
  targetVolume: number
  channels: PipetteChannels
  tipLiquidSpecs: SupportedTip
  flowRateType: FlowRateType
  correctionVolume: number
  shaftULperMM: number
}): number => {
  const {
    targetVolume,
    channels,
    tipLiquidSpecs,
    flowRateType,
    correctionVolume,
    shaftULperMM,
  } = args

  const maxPlungerSpeed = CHANNELS_MAPPED_TO_MAX_SPEED[channels].plunger
  if (flowRateType === 'blowout') {
    return round(shaftULperMM * maxPlungerSpeed)
  }
  const pipetteAccuracyUlPerMm = _getPipetteAccuracyUlPerMm({
    targetVolume,
    tipLiquidSpecs,
    flowRateType,
  })
  const correctionMultiplier = 1.0 + correctionVolume / targetVolume
  const travelMm = targetVolume / pipetteAccuracyUlPerMm
  const travelMmCorrected = travelMm * correctionMultiplier
  return round(targetVolume / (travelMmCorrected / maxPlungerSpeed))
}
