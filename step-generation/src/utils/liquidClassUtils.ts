import { formatPyDict } from './pythonFormat'

import type { PipetteName } from '@opentrons/shared-data'
import type { TransferArgs } from '../types'

interface Offset {
  offset: {
    x?: number
    y?: number
    z?: number
  }
}
type BlowoutLocation = 'source' | 'destination' | 'trash'

interface CustomLiquidClassPropertiesProps {
  args: TransferArgs
  pipetteName: PipetteName
  tiprackUri: string
  aspirateCorrectionVolume: number
  dispenseCorrectionVolume: number
}

const getOffset = (x: number, y: number, z: number): Offset | {} => {
  if (x === 0 && y === 0 && z === 0) {
    return {}
  }
  return {
    offset: {
      ...(x === 0 ? {} : { x }),
      ...(y === 0 ? {} : { y }),
      ...(z === 0 ? {} : { z }),
    },
  }
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

  //    properties object is based off of liquid class schema
  //    shared-data/liquid-class/schemas/1.json
  const properties = {
    aspirate: {
      aspirate_position: {
        ...getOffset(
          args.aspirateXOffset,
          args.aspirateYOffset,
          args.aspirateZOffset
        ),
        position_reference: args.aspiratePositionReference,
      },
      ...(args.aspirateFlowRateUlSec === 0
        ? {}
        : {
            flow_rate_by_volume: [[0, args.aspirateFlowRateUlSec]],
          }),
      ...(args.preWetTip ? { pre_wet: args.preWetTip } : {}),
      ...(aspirateCorrectionVolume === 0
        ? {}
        : {
            correction_by_volume: [[0, aspirateCorrectionVolume]],
          }),
      ...(args.aspirateDelay == null
        ? {}
        : {
            delay: {
              enable: true,
              params: { duration: args.aspirateDelay?.seconds ?? undefined },
            },
          }),
      ...(args.mixBeforeAspirate == null
        ? {}
        : {
            mix: {
              enable: true,
              params: {
                repetitions: args.mixBeforeAspirate?.times ?? undefined,
                volume: args.mixBeforeAspirate?.volume ?? undefined,
              },
            },
          }),
      submerge: {
        ...(args.aspirateSubmergeDelay == null
          ? {}
          : {
              delay: {
                enable: true,
                params: {
                  duration: args.aspirateSubmergeDelay?.seconds ?? undefined,
                },
              },
            }),
        speed: args.aspirateSubmergeSpeed ?? undefined,
        start_position: {
          ...getOffset(
            args.aspirateSubmergeXOffset,
            args.aspirateSubmergeYOffset,
            args.aspirateSubmergeZOffset
          ),
          position_reference: args.aspirateSubmergePositionReference,
        },
      },
      retract: {
        ...(args.aspirateAirGapVolume == null || args.aspirateAirGapVolume === 0
          ? {}
          : {
              air_gap_by_volume: [[0, args.aspirateAirGapVolume]],
            }),
        ...(args.aspirateRetractDelay == null
          ? {}
          : {
              delay: {
                enable: true,
                params: {
                  duration: args.aspirateRetractDelay?.seconds ?? undefined,
                },
              },
            }),

        end_position: {
          ...getOffset(
            args.aspirateRetractXOffset,
            args.aspirateRetractYOffset,
            args.aspirateRetractZOffset
          ),
          position_reference: args.aspirateRetractPositionReference,
        },
        speed: args.aspirateRetractSpeed ?? undefined,
        ...(!args.touchTipAfterAspirate
          ? {}
          : {
              touch_tip: {
                enable: true,
                params: {
                  z_offset: args.touchTipAfterAspirateOffsetMmFromTop,
                  mm_from_edge:
                    args.touchTipAfterAspirateMmFromEdge ?? undefined,
                  speed: args.touchTipAfterAspirateSpeed ?? undefined,
                },
              },
            }),
      },
    },
    dispense: {
      dispense_position: {
        ...getOffset(
          args.dispenseXOffset,
          args.dispenseYOffset,
          args.dispenseZOffset
        ),
        position_reference: args.dispensePositionReference,
      },
      ...(args.pushOut == null
        ? {}
        : {
            push_out_by_volume: [[0, args.pushOut]],
          }),
      ...(args.dispenseFlowRateUlSec == null || args.dispenseFlowRateUlSec === 0
        ? {}
        : {
            flow_rate_by_volume: [[0, args.dispenseFlowRateUlSec]],
          }),
      ...(dispenseCorrectionVolume === 0
        ? {}
        : {
            correction_by_volume: [[0, dispenseCorrectionVolume]],
          }),
      ...(args.dispenseDelay == null
        ? {}
        : {
            delay: {
              enable: true,
              params: { duration: args.dispenseDelay?.seconds ?? undefined },
            },
          }),
      ...(args.mixInDestination == null
        ? {}
        : {
            mix: {
              enable: true,
              params: {
                repetitions: args.mixInDestination?.times ?? undefined,
                volume: args.mixInDestination?.volume ?? undefined,
              },
            },
          }),
      submerge: {
        ...(args.dispenseSubmergeDelay == null
          ? {}
          : {
              delay: {
                enable: true,
                params: {
                  duration: args.dispenseSubmergeDelay?.seconds ?? undefined,
                },
              },
            }),
        speed: args.dispenseSubmergeSpeed ?? undefined,
        start_position: {
          ...getOffset(
            args.dispenseSubmergeXOffset,
            args.dispenseSubmergeYOffset,
            args.dispenseSubmergeZOffset
          ),
          position_reference: args.dispenseSubmergePositionReference,
        },
      },
      retract: {
        ...(args.dispenseAirGapVolume == null || args.dispenseAirGapVolume === 0
          ? {}
          : {
              air_gap_by_volume: [[0, args.dispenseAirGapVolume]],
            }),
        ...(args.dispenseRetractDelay == null
          ? {}
          : {
              delay: {
                enable: true,
                params: {
                  duration: args.dispenseRetractDelay?.seconds ?? undefined,
                },
              },
            }),
        end_position: {
          ...getOffset(
            args.dispenseRetractXOffset,
            args.dispenseRetractYOffset,
            args.dispenseRetractZOffset
          ),
          position_reference: args.dispenseRetractPositionReference,
        },
        speed: args.dispenseRetractSpeed ?? undefined,
        ...(!args.touchTipAfterDispense
          ? {}
          : {
              touch_tip: {
                enable: true,
                params: {
                  z_offset: args.touchTipAfterDispenseOffsetMmFromTop,
                  mm_from_edge:
                    args.touchTipAfterDispenseMmFromEdge ?? undefined,
                  speed: args.touchTipAfterDispenseSpeed ?? undefined,
                },
              },
            }),
        ...(args.blowoutLocation == null
          ? {}
          : {
              blowout: {
                enable: true,
                params: {
                  location:
                    (args.blowoutLocation as BlowoutLocation) ?? undefined,
                  flow_rate: args.blowoutFlowRateUlSec,
                },
              },
            }),
      },
    },
  }

  const customLiquidClassProperties = {
    [pipetteName]: {
      [tiprackUri]: properties,
    },
  }

  const stringifiedCustomLiquidClassProperties: Record<
    string,
    any
  > = JSON.parse(JSON.stringify(customLiquidClassProperties))
  return formatPyDict(stringifiedCustomLiquidClassProperties, true)
}
