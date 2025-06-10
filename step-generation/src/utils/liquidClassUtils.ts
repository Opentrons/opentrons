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
  params: {
    duration?: number
  }
}

interface TouchTip {
  enabled: boolean
  params: {
    z_offset?: number
    mm_from_edge?: number
    speed?: number
  }
}

type BlowoutLocation = 'source' | 'destination' | 'trash'
interface BlowOut {
  enabled: boolean
  params: {
    location?: BlowoutLocation
    flow_rate?: number
  }
}

interface Mix {
  enabled: boolean
  params: {
    repetitions?: number
    volume?: number
  }
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

  const properties = {
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
      correction_by_volume: [[0, aspirateCorrectionVolume]],
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
          offset: {
            x: args.aspirateRetractXOffset,
            y: args.aspirateRetractYOffset,
            z: args.aspirateRetractZOffset,
          },
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
          offset: {
            x: args.dispenseRetractXOffset,
            y: args.dispenseRetractYOffset,
            z: args.dispenseRetractZOffset,
          },
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
