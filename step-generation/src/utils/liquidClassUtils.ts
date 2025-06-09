import { formatPyDict } from './pythonFormat'

import type { PipetteName } from '@opentrons/shared-data'
import type { TransferArgs } from '../types'

interface Offset {
  x: number
  y: number
  z: number
}

interface Position {
  offset: Offset
  position_reference: string // ex. "well-bottom"
}

interface Delay {
  enabled: boolean
  duration?: number
}

interface TouchTip {
  enabled: boolean
  z_offset?: number
  mm_from_edge?: number
  speed?: number
}

type BlowoutLocation = 'source' | 'destination' | 'trash'
interface BlowOut {
  enabled: boolean
  location?: BlowoutLocation
  flow_rate?: number
}

interface Mix {
  enabled: boolean
  repetitions?: number
  volume?: number
}

interface Retract {
  air_gap_by_volume: number[][]
  delay: Delay
  end_position: Position
  speed?: number
  touch_tip?: TouchTip
  blowout?: BlowOut
}

interface Submerge {
  delay: Delay
  start_position: Position
  speed?: number
}

interface CommonLiquidSettings {
  correction_by_volume: number[][]
  delay: Delay
  mix: Mix
  retract: Retract
  submerge: Submerge
  flow_rate_by_volume: number[][]
}

interface AspirateSettings extends CommonLiquidSettings {
  aspirate_position: Position
  pre_wet?: boolean
}

interface DispenseSettings extends CommonLiquidSettings {
  dispense_position: Position
  push_out_by_volume: number[][]
}

interface AspirateAndDispenseSettings {
  aspirate: AspirateSettings
  dispense: DispenseSettings
}

export interface CustomLiquidClassProperties {
  [pipetteName: string]: {
    [tiprackUri: string]: AspirateAndDispenseSettings
  }
}

interface CustomLiquidClassPropertiesProps {
  args: TransferArgs
  pipetteName: PipetteName
  tiprackUri: string
  aspirateCorrectionVolume: number
  dispenseCorrectionVolume: number
  volumes: number[]
}
interface SettingByVolume {
  flowRateByVolumeAspirate: number[][]
  flowRateByVolumeDispense: number[][]
  correctionByVolumeAspirate: number[][]
  correctionByVolumeDispense: number[][]
  pushOutByVolume: number[][]
  airGapByVolume: number[][]
  airGapByVolumeRetract: number[][]
}

export const getCustomLiquidClassProperties = (
  props: CustomLiquidClassPropertiesProps
): string => {
  const {
    args,
    pipetteName,
    tiprackUri,
    aspirateCorrectionVolume,
    dispenseCorrectionVolume,
    volumes,
  } = props

  const {
    flowRateByVolumeAspirate,
    flowRateByVolumeDispense,
    correctionByVolumeAspirate,
    correctionByVolumeDispense,
    pushOutByVolume,
    airGapByVolume,
    airGapByVolumeRetract,
  } = volumes.reduce(
    (acc: SettingByVolume, volume) => {
      acc.flowRateByVolumeAspirate.push([
        args.aspirateFlowRateUlSec ?? 0,
        volume,
      ])
      acc.flowRateByVolumeDispense.push([
        args.dispenseFlowRateUlSec ?? 0,
        volume,
      ])
      acc.correctionByVolumeAspirate.push([
        aspirateCorrectionVolume ?? 0,
        volume,
      ])
      acc.correctionByVolumeDispense.push([
        dispenseCorrectionVolume ?? 0,
        volume,
      ])
      acc.pushOutByVolume.push([args.pushOut ?? 0, volume])
      acc.airGapByVolume.push([args.aspirateAirGapVolume ?? 0, volume])
      acc.airGapByVolumeRetract.push([args.dispenseAirGapVolume ?? 0, volume])
      return acc
    },
    {
      flowRateByVolumeAspirate: [],
      flowRateByVolumeDispense: [],
      correctionByVolumeAspirate: [],
      correctionByVolumeDispense: [],
      pushOutByVolume: [],
      airGapByVolume: [],
      airGapByVolumeRetract: [],
    }
  )

  const customLiquidClassProperties: CustomLiquidClassProperties = {
    [pipetteName]: {
      [tiprackUri]: {
        aspirate: {
          aspirate_position: {
            offset: {
              x: args.aspirateXOffset,
              y: args.aspirateYOffset,
              z: args.aspirateZOffset,
            },
            position_reference: args.aspiratePositionReference,
          },
          flow_rate_by_volume: flowRateByVolumeAspirate,

          pre_wet: args.preWetTip,
          correction_by_volume: correctionByVolumeAspirate,
          delay: {
            enabled: args.aspirateDelay != null,
            duration: args.aspirateDelay?.seconds ?? undefined,
          },
          mix: {
            enabled: args.mixBeforeAspirate != null,
            repetitions: args.mixBeforeAspirate?.times ?? undefined,
            volume: args.mixBeforeAspirate?.volume ?? undefined,
          },
          submerge: {
            delay: {
              enabled: args.aspirateSubmergeDelay != null,
              duration: args.aspirateSubmergeDelay?.seconds ?? undefined,
            },
            speed: args.aspirateSubmergeSpeed ?? undefined,
            start_position: {
              offset: {
                x: args.aspirateSubmergeXOffset,
                y: args.aspirateSubmergeYOffset,
                z: args.aspirateSubmergeZOffset,
              },
              position_reference: args.aspirateSubmergePositionReference,
            },
          },
          retract: {
            air_gap_by_volume: airGapByVolume,
            delay: {
              enabled: args.aspirateRetractDelay != null,
              duration: args.aspirateRetractDelay?.seconds ?? undefined,
            },
            end_position: {
              offset: {
                x: args.aspirateRetractXOffset,
                y: args.aspirateRetractYOffset,
                z: args.aspirateRetractZOffset,
              },
              position_reference: args.aspirateRetractPositionReference,
            },
            speed: args.aspirateRetractSpeed ?? undefined,
            touch_tip: {
              enabled: args.touchTipAfterAspirate,
              z_offset: args.touchTipAfterAspirateOffsetMmFromTop,
              mm_from_edge: args.touchTipAfterAspirateMmFromEdge ?? undefined,
              speed: args.touchTipAfterAspirateSpeed ?? undefined,
            },
          },
        },
        dispense: {
          dispense_position: {
            offset: {
              x: args.dispenseXOffset,
              y: args.dispenseYOffset,
              z: args.dispenseZOffset,
            },
            position_reference: args.dispensePositionReference,
          },
          push_out_by_volume: pushOutByVolume,
          flow_rate_by_volume: flowRateByVolumeDispense,
          correction_by_volume: correctionByVolumeDispense,

          delay: {
            enabled: args.dispenseDelay != null,
            duration: args.dispenseDelay?.seconds ?? undefined,
          },
          mix: {
            enabled: args.mixInDestination != null,
            repetitions: args.mixInDestination?.times ?? undefined,
            volume: args.mixInDestination?.volume ?? undefined,
          },
          submerge: {
            delay: {
              enabled: args.dispenseSubmergeDelay != null,
              duration: args.dispenseSubmergeDelay?.seconds ?? undefined,
            },
            speed: args.dispenseSubmergeSpeed ?? undefined,
            start_position: {
              offset: {
                x: args.dispenseSubmergeXOffset,
                y: args.dispenseSubmergeYOffset,
                z: args.dispenseSubmergeZOffset,
              },
              position_reference: args.dispenseSubmergePositionReference,
            },
          },
          retract: {
            air_gap_by_volume: airGapByVolumeRetract,
            delay: {
              enabled: args.dispenseRetractDelay != null,
              duration: args.dispenseRetractDelay?.seconds ?? undefined,
            },
            end_position: {
              offset: {
                x: args.dispenseRetractXOffset,
                y: args.dispenseRetractYOffset,
                z: args.dispenseRetractZOffset,
              },
              position_reference: args.dispenseRetractPositionReference,
            },
            speed: args.dispenseRetractSpeed ?? undefined,
            touch_tip: {
              enabled: args.touchTipAfterDispense,
              z_offset: args.touchTipAfterDispenseOffsetMmFromTop,
              mm_from_edge: args.touchTipAfterDispenseMmFromEdge ?? undefined,
              speed: args.touchTipAfterDispenseSpeed ?? undefined,
            },
            blowout: {
              enabled: args.blowoutLocation != null,
              location: (args.blowoutLocation as BlowoutLocation) ?? undefined,
              flow_rate: args.blowoutFlowRateUlSec,
            },
          },
        },
      },
    },
  }

  const stringifiedCustomLiquidClassProperties: Record<
    string,
    any
  > = JSON.parse(JSON.stringify(customLiquidClassProperties))
  //    TODO: python name should be dynamic, will fix that later
  return `custom_liquid_class_properties = ${formatPyDict(
    stringifiedCustomLiquidClassProperties,
    true
  )}`
}
