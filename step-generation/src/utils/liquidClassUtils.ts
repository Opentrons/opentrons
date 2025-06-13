import { getAllLiquidClassDefs } from '@opentrons/shared-data'

import {
  DEST_WELL_BLOWOUT_DESTINATION,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from './misc'
import { formatPyDict } from './pythonFormat'

import type { PipetteName } from '@opentrons/shared-data'
import type { ConsolidateArgs, InnerMixArgs, TransferArgs } from '../types'

type BlowoutLocation = 'source' | 'destination' | 'trash'

interface CustomLiquidClassPropertiesProps {
  args: TransferArgs | ConsolidateArgs
  pipetteName: PipetteName
  tiprackUri: string
  aspirateCorrectionVolume: number
  dispenseCorrectionVolume: number
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
  } = props

  let aspirateMixArgs: InnerMixArgs | null = null
  if ('mixBeforeAspirate' in args) {
    aspirateMixArgs = args.mixBeforeAspirate as InnerMixArgs | null
  } else if ('mixFirstAspirate' in args) {
    aspirateMixArgs = args.mixFirstAspirate as InnerMixArgs | null
  }
  //    properties object is based off of liquid class schema
  //    shared-data/liquid-class/schemas/1.json
  const customLiquidClassProperties = {
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
          flow_rate_by_volume: [[0, args.aspirateFlowRateUlSec]],

          pre_wet: args.preWetTip,
          correction_by_volume: [[0, aspirateCorrectionVolume ?? 0]],
          delay: {
            enabled: args.aspirateDelay != null,
            duration: args.aspirateDelay?.seconds ?? undefined,
          },
          mix: {
            enabled: aspirateMixArgs != null,
            repetitions: aspirateMixArgs?.times ?? undefined,
            volume: aspirateMixArgs?.volume ?? undefined,
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
            air_gap_by_volume: [[0, args.aspirateAirGapVolume ?? 0]],
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
              z_offset: args.touchTipAfterAspirate
                ? args.touchTipAfterAspirateOffsetMmFromTop
                : undefined,
              mm_from_edge:
                args.touchTipAfterAspirate &&
                args.touchTipAfterAspirateMmFromEdge != null
                  ? args.touchTipAfterAspirateMmFromEdge
                  : undefined,
              speed: args.touchTipAfterAspirate
                ? args.touchTipAfterAspirateSpeed
                : undefined,
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
          push_out_by_volume: [[0, args.pushOut ?? 0]],
          flow_rate_by_volume: [[0, args.dispenseFlowRateUlSec ?? 0]],
          correction_by_volume: [[0, dispenseCorrectionVolume ?? 0]],

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
            air_gap_by_volume: [[0, args.dispenseAirGapVolume ?? 0]],
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
              z_offset: args.touchTipAfterDispense
                ? args.touchTipAfterDispenseOffsetMmFromTop
                : undefined,
              mm_from_edge:
                args.touchTipAfterDispense &&
                args.touchTipAfterDispenseMmFromEdge != null
                  ? args.touchTipAfterDispenseMmFromEdge
                  : undefined,
              speed: args.touchTipAfterDispense
                ? args.touchTipAfterDispenseSpeed
                : undefined,
            },
            blowout: {
              enabled: args.blowoutLocation != null,
              location: getBlowoutPythonLocation(args.blowoutLocation),
              flow_rate:
                args.blowoutLocation != null
                  ? args.blowoutFlowRateUlSec
                  : undefined,
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
  return formatPyDict(stringifiedCustomLiquidClassProperties, true)
}

export const getPythonLiquidClassName = (liquidClass: string): string => {
  const allLiquidClassDefs = getAllLiquidClassDefs()
  const liquidClassDef = allLiquidClassDefs[liquidClass]
  return `${liquidClassDef.liquidClassName}_v${liquidClassDef.schemaVersion}`
}

const getBlowoutPythonLocation = (
  blowoutLocation?: string | null
): BlowoutLocation | undefined => {
  if (blowoutLocation == null) {
    return undefined
  } else if (blowoutLocation === SOURCE_WELL_BLOWOUT_DESTINATION) {
    return 'source'
  } else if (blowoutLocation === DEST_WELL_BLOWOUT_DESTINATION) {
    return 'destination'
  } else {
    return 'trash'
  }
}
