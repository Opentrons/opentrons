import round from 'lodash/round'

import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import type {
  PipetteChannels,
  RobotType,
  SupportedTip,
} from '@opentrons/shared-data'

type FlowRateType = 'aspirate' | 'dispense' | 'blowout'

// Note(kk:2025-09-05): keep OT-2 values since we will move the same functions from (app&pd) to shared-data after the release
export const FLEX_X_Y_MAX_SPEED = 300
export const FLEX_LOW_THROUGHPUT_Z_MAX_SPEED = 100
export const FLEX_HIGH_THROUGHPUT_Z_MAX_SPEED = 35
export const FLEX_LOW_THROUGHPUT_PLUNGER_MAX_SPEED = 70
export const FLEX_HIGH_THROUGHPUT_PLUNGER_MAX_SPEED = 15
export const OT2_X_MAX_SPEED = 600
export const OT2_Y_MAX_SPEED = 400
export const OT2_Z_MAX_SPEED = 125
export const OT2_PLUNGER_MAX_SPEED = 40

const CHANNELS_MAPPED_TO_MAX_SPEED: Record<
  RobotType,
  Record<number, { plunger: number; x: number; y: number; z: number }>
> = {
  [FLEX_ROBOT_TYPE]: {
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
  },
  [OT2_ROBOT_TYPE]: {
    1: {
      plunger: OT2_PLUNGER_MAX_SPEED,
      x: OT2_X_MAX_SPEED,
      y: OT2_Y_MAX_SPEED,
      z: OT2_Z_MAX_SPEED,
    },
    8: {
      plunger: OT2_PLUNGER_MAX_SPEED,
      x: OT2_X_MAX_SPEED,
      y: OT2_Y_MAX_SPEED,
      z: OT2_Z_MAX_SPEED,
    },
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
  const result = lastEntry[1] * targetVolume + lastEntry[2]
  return result
}

export const getMaxUiFlowRate = (args: {
  targetVolume: number
  channels: PipetteChannels
  tipLiquidSpecs: SupportedTip
  flowRateType: FlowRateType
  correctionVolume: number
  shaftULperMM: number
  robotType: RobotType
}): number => {
  const {
    targetVolume,
    channels,
    tipLiquidSpecs,
    flowRateType,
    correctionVolume,
    shaftULperMM,
    robotType,
  } = args

  const maxPlungerSpeed =
    CHANNELS_MAPPED_TO_MAX_SPEED[robotType][channels].plunger

  if (flowRateType === 'blowout') {
    const result = round(shaftULperMM * maxPlungerSpeed)
    return result
  }

  const pipetteAccuracyUlPerMm = _getPipetteAccuracyUlPerMm({
    targetVolume,
    tipLiquidSpecs,
    flowRateType,
  })

  const correctionMultiplier = 1.0 + correctionVolume / targetVolume
  const travelMm = targetVolume / pipetteAccuracyUlPerMm
  const travelMmCorrected = travelMm * correctionMultiplier
  const result = round(targetVolume / (travelMmCorrected / maxPlungerSpeed))

  return result
}
