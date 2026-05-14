import {
  getAllLiquidClassDefs,
  POSITION_REFERENCE_TOP,
} from '@opentrons/shared-data'

import {
  DEST_WELL_BLOWOUT_DESTINATION,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from './misc'
import { formatPyDict } from './pythonFormat'

import type { ByTipTypeSetting } from '@opentrons/shared-data'
import type {
  ConsolidateArgs,
  DistributeArgs,
  InnerMixArgs,
  LabwareEntities,
  TransferArgs,
} from '../types'

type BlowoutLocation = 'source' | 'destination' | 'trash'

interface CustomLiquidClassPropertiesProps {
  args: TransferArgs | ConsolidateArgs | DistributeArgs
  pipetteName: string
  tiprackUri: string
  liquidClassValuesForTip: ByTipTypeSetting | null
}

export const getCustomLiquidClassProperties = (
  props: CustomLiquidClassPropertiesProps
): string => {
  const { args, pipetteName, tiprackUri, liquidClassValuesForTip } = props
  let aspirateMixArgs: InnerMixArgs | null = null
  if ('mixBeforeAspirate' in args) {
    aspirateMixArgs = args.mixBeforeAspirate as InnerMixArgs | null
  } else if ('mixFirstAspirate' in args) {
    aspirateMixArgs = args.mixFirstAspirate as InnerMixArgs | null
  }
  const blowoutPosition = getBlowoutWellPosition(args)
  const sharedDispenseArgs = {
    dispense_position: {
      offset: {
        x: args.dispenseXOffset,
        y: args.dispenseYOffset,
        z: args.dispenseZOffset,
      },
      position_reference: args.dispensePositionReference,
    },
    flow_rate_by_volume: [[0, args.dispenseFlowRateUlSec ?? 0]],
    delay: {
      enabled: !!args.dispenseDelay?.seconds,
      ...(args.dispenseDelay?.seconds
        ? { duration: args.dispenseDelay?.seconds }
        : {}),
    },
    submerge: {
      delay: {
        enabled: !!args.dispenseSubmergeDelay?.seconds,
        ...(args.dispenseSubmergeDelay?.seconds
          ? { duration: args.dispenseSubmergeDelay?.seconds }
          : {}),
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
        enabled: !!args.dispenseRetractDelay?.seconds,
        ...(args.dispenseRetractDelay?.seconds
          ? { duration: args.dispenseRetractDelay?.seconds }
          : {}),
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
          args.blowoutLocation != null ? args.blowoutFlowRateUlSec : undefined,
        ...(blowoutPosition != null
          ? { blowout_position: blowoutPosition }
          : {}),
      },
    },
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
          correction_by_volume: liquidClassValuesForTip?.aspirate
            .correctionByVolume ?? [[0, 0]], // nullish coalescing for type checks. Should never hit
          delay: {
            enabled: !!args.aspirateDelay?.seconds,
            ...(args.aspirateDelay?.seconds
              ? { duration: args.aspirateDelay?.seconds }
              : {}),
          },
          mix: {
            enabled: !!aspirateMixArgs?.volume,
            ...(aspirateMixArgs?.times
              ? { repetitions: aspirateMixArgs.times }
              : {}),
            ...(aspirateMixArgs?.volume
              ? { volume: aspirateMixArgs.volume }
              : {}),
          },
          submerge: {
            delay: {
              enabled: !!args.aspirateSubmergeDelay?.seconds,
              ...(args.aspirateSubmergeDelay?.seconds
                ? { duration: args.aspirateSubmergeDelay?.seconds }
                : {}),
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
              enabled: !!args.aspirateRetractDelay?.seconds,
              ...(args.aspirateRetractDelay?.seconds
                ? { duration: args.aspirateRetractDelay?.seconds }
                : {}),
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
          ...sharedDispenseArgs,
          correction_by_volume: liquidClassValuesForTip?.singleDispense
            .correctionByVolume ?? [[0, 0]], // nullish coalescing for type checks. Should never hit
          push_out_by_volume: [[0, args.pushOut ?? 0]],
          mix: {
            enabled:
              'mixInDestination' in args
                ? args.mixInDestination != null
                : false,
            repetitions:
              'mixInDestination' in args
                ? (args.mixInDestination?.times ?? undefined)
                : undefined,
            volume:
              'mixInDestination' in args
                ? (args.mixInDestination?.volume ?? undefined)
                : undefined,
          },
        },
        ...(args.commandCreatorFnName === 'distribute'
          ? {
              multi_dispense: {
                ...sharedDispenseArgs,
                //  distribute specific args
                correction_by_volume: liquidClassValuesForTip?.multiDispense
                  ?.correctionByVolume ?? [[0, 0]], // nullish coalescing for type checks. Should never hit
                ...('conditioningVolume' in args
                  ? {
                      conditioning_by_volume: [
                        [0, args.conditioningVolume ?? 0],
                      ],
                    }
                  : {}),
                ...('disposalVolume' in args
                  ? {
                      disposal_by_volume: [[0, args.disposalVolume ?? 0]],
                    }
                  : {}),
              },
            }
          : {}),
      },
    },
  }

  const stringifiedCustomLiquidClassProperties: Record<string, any> =
    JSON.parse(JSON.stringify(customLiquidClassProperties))
  return formatPyDict(stringifiedCustomLiquidClassProperties)
}

export const getLiquidClassName = (
  liquidClass: string, // a liquid class name like "water", "none" is not allowed
  showBase?: boolean
): string => {
  const allLiquidClassDefs = getAllLiquidClassDefs()
  const liquidClassDef = allLiquidClassDefs[liquidClass]
  return `${liquidClassDef.liquidClassName}${showBase ? `_base_class` : ''}`
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

const getBlowoutWellPosition = (
  args: TransferArgs | ConsolidateArgs | DistributeArgs
): {} | null => {
  const location = getBlowoutPythonLocation(args.blowoutLocation)
  if (!location || location === 'trash') {
    return null
  }
  return {
    offset: {
      x: args.blowoutXPosition ?? 0,
      y: args.blowoutYPosition ?? 0,
      z: args.blowoutOffsetFromTopMm ?? 1,
    },
    position_reference: args.blowoutPositionReference ?? POSITION_REFERENCE_TOP,
  }
}

export const getPythonAssignTipRacksString = (args: {
  labwareEntities: LabwareEntities
  tiprackIds: string[]
}): string => {
  const { labwareEntities, tiprackIds } = args
  const tiprackPythonNames = tiprackIds.map(
    id => labwareEntities[id].pythonName
  )
  return `tip_racks=[${tiprackPythonNames.join(', ')}]`
}
