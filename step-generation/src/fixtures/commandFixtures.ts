import { expect } from 'vitest'

import {
  ONE_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA,
  SAFE_MOVE_TO_WELL_LOCATION,
  WELL_ORIGIN_TOP,
} from '@opentrons/shared-data'

import { AIR_GAP_OFFSET_FROM_TOP } from '../constants'
import {
  AIR_GAP_META,
  DEFAULT_BLOWOUT_WELL,
  DEFAULT_PIPETTE,
  DEST_LABWARE,
  SOURCE_LABWARE,
  tiprackWellNamesFlat,
} from './data'

import type {
  AddressableAreaName,
  AspDispAirgapParams,
  AspirateInPlaceParams,
  BlowoutParams,
  CreateCommand,
  DispenseInPlaceParams,
  DispenseParams,
  MoveToWellParams,
  TouchTipParams,
  WellLocation,
} from '@opentrons/shared-data'
import type { CommandCreatorErrorResponse, CommandsAndWarnings } from '../types'

/** Used to wrap command creators in tests, effectively casting their results
 **  to normal response or error response
 **/
export function getSuccessResult(
  result: CommandsAndWarnings | CommandCreatorErrorResponse
): CommandsAndWarnings {
  if ('errors' in result) {
    throw new Error(
      `Expected a successful command creator call but got errors: ${JSON.stringify(
        result.errors
      )}`
    )
  }

  return result
}
export function getErrorResult(
  result: CommandsAndWarnings | CommandCreatorErrorResponse
): CommandCreatorErrorResponse {
  if (!('errors' in result)) {
    throw new Error(
      `Expected command creator to return errors but got success result`
    )
  }

  return result
}
export const replaceTipCommands = (tip: number | string): CreateCommand[] => [
  ...dropTipHelper(),
  pickUpTipHelper(tip),
]
export const prepareAndConfigureCommands = (
  volumeToConfigure?: number
): CreateCommand[] => {
  const configureCommands: CreateCommand[] =
    volumeToConfigure != null
      ? [
          {
            commandType: 'configureForVolume',
            key: expect.any(String),
            params: {
              pipetteId: 'p300SingleId',
              volume: volumeToConfigure,
            },
          },
        ]
      : []
  return [
    ...configureCommands,
    {
      commandType: 'prepareToAspirate',
      key: expect.any(String),
      params: {
        pipetteId: 'p300SingleId',
      },
    },
  ]
}
// NOTE: make sure none of these numbers match each other!
const ASPIRATE_FLOW_RATE = 2.1
const DISPENSE_FLOW_RATE = 2.2
export const BLOWOUT_FLOW_RATE = 2.3
export const ASPIRATE_OFFSET_FROM_BOTTOM_MM = 3.1
export const DISPENSE_OFFSET_FROM_BOTTOM_MM = 3.2
export const BLOWOUT_OFFSET_FROM_TOP_MM = 3.3
const TOUCH_TIP_OFFSET_FROM_TOP_MM = -3.4
interface FlowRateAndOffsetParamsTransferlike {
  aspirateFlowRateUlSec: number
  dispenseFlowRateUlSec: number
  blowoutFlowRateUlSec: number
  aspirateOffsetFromBottomMm: number
  dispenseOffsetFromBottomMm: number
  blowoutOffsetFromTopMm: number
  touchTipAfterAspirateOffsetMmFromTop: number
  touchTipAfterDispenseOffsetMmFromTop: number
}
export const getFlowRateAndOffsetParamsTransferLike = (): FlowRateAndOffsetParamsTransferlike => ({
  aspirateFlowRateUlSec: ASPIRATE_FLOW_RATE,
  dispenseFlowRateUlSec: DISPENSE_FLOW_RATE,
  blowoutFlowRateUlSec: BLOWOUT_FLOW_RATE,
  aspirateOffsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
  dispenseOffsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
  blowoutOffsetFromTopMm: BLOWOUT_OFFSET_FROM_TOP_MM,
  // for consolidate/distribute/transfer only
  touchTipAfterAspirateOffsetMmFromTop: TOUCH_TIP_OFFSET_FROM_TOP_MM,
  touchTipAfterDispenseOffsetMmFromTop: TOUCH_TIP_OFFSET_FROM_TOP_MM,
})
interface FlowRateAndOffsetParamsMix {
  aspirateFlowRateUlSec: number
  dispenseFlowRateUlSec: number
  blowoutFlowRateUlSec: number
  aspirateOffsetFromBottomMm: number
  dispenseOffsetFromBottomMm: number
  blowoutOffsetFromTopMm: number
  touchTipMmFromTop: number
}
export const getFlowRateAndOffsetParamsMix = (): FlowRateAndOffsetParamsMix => ({
  aspirateFlowRateUlSec: ASPIRATE_FLOW_RATE,
  dispenseFlowRateUlSec: DISPENSE_FLOW_RATE,
  blowoutFlowRateUlSec: BLOWOUT_FLOW_RATE,
  aspirateOffsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
  dispenseOffsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
  blowoutOffsetFromTopMm: BLOWOUT_OFFSET_FROM_TOP_MM,
  // for mix only
  touchTipMmFromTop: TOUCH_TIP_OFFSET_FROM_TOP_MM,
})
type MakeAspDispHelper<P> = (
  bakedParams?: Partial<P>
) => (well: string, volume: number, params?: Partial<P>) => CreateCommand
type MakeAspDispCompoundHelper<P, P2> = (
  bakedParams?: Partial<P>
) => (
  inPlaceParams: P,
  moveToWellParams?: P2,
  doMove?: boolean
) => CreateCommand[]

const _defaultAspirateParams = {
  pipetteId: DEFAULT_PIPETTE,
  labwareId: SOURCE_LABWARE,
}

export const makeAspirateHelper: MakeAspDispHelper<AspDispAirgapParams> = bakedParams => (
  wellName,
  volume,
  params
) => ({
  commandType: 'aspirate',
  key: expect.any(String),
  params: {
    ..._defaultAspirateParams,
    ...bakedParams,
    wellName,
    volume,
    wellLocation: {
      origin: 'bottom',
      offset: {
        y: 0,
        x: 0,
        z: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
      },
    },
    flowRate: ASPIRATE_FLOW_RATE,
    ...params,
  },
})

export const makeAspirateInPlaceHelper: MakeAspDispCompoundHelper<
  AspirateInPlaceParams,
  MoveToWellParams
> = bakedParams => (aspirateInPlaceParams, moveToWellParams, doMove = true) => {
  const moveCommand: CreateCommand | null =
    doMove && moveToWellParams != null
      ? {
          commandType: 'moveToWell',
          key: expect.any(String),
          params: moveToWellParams,
        }
      : null
  return [
    ...(moveCommand != null ? [moveCommand] : []),
    {
      commandType: 'aspirateInPlace',
      key: expect.any(String),
      params: aspirateInPlaceParams,
    },
  ] as CreateCommand[]
}

export const makeDispenseInPlaceHelper: MakeAspDispCompoundHelper<
  DispenseInPlaceParams,
  MoveToWellParams
> = bakedParams => (dispenseInPlaceParams, moveToWellParams) => [
  {
    commandType: 'dispenseInPlace',
    key: expect.any(String),
    params: dispenseInPlaceParams,
  },
]

export const aspirateHelperLiquidClass = (submergeParams: {
  pipetteId: string
  labwareId: string
  wellName: string
  volume: number
  submergeSpeed: number
  retractSpeed: number
  aspirateFlowRate: number
  submergeLocation: WellLocation
  aspirateLocation: WellLocation
  retractLocation: WellLocation
  aspirateAirGap?: number
  dispenseAirGap?: number
  dispenseFlowRate?: number
  shouldProbe?: boolean
  shouldPreWet?: boolean
  shouldTouchTip?: boolean
  submergeDelay?: number
  aspirateDelay?: number
  retractDelay?: number
  dispenseDelay?: number
  mixTimes?: number
  mixVolume?: number
  touchTipMmFromTop?: number
  touchTipMmFromEdge?: number
  touchTipSpeed?: number
  isRetractSafeForAirGap?: boolean
}) => {
  const {
    volume,
    aspirateFlowRate,
    dispenseFlowRate,
    submergeSpeed,
    retractSpeed,
    pipetteId,
    labwareId,
    wellName,
    submergeLocation,
    aspirateLocation,
    retractLocation,
    // shouldProbe = true,
    shouldPreWet = false,
    shouldTouchTip = false,
    submergeDelay = 0,
    aspirateDelay = 0,
    retractDelay = 0,
    dispenseDelay = 0,
    mixTimes = 0,
    mixVolume = 0,
    aspirateAirGap = 0,
    dispenseAirGap = 0,
    touchTipMmFromTop,
    touchTipMmFromEdge,
    touchTipSpeed,
    isRetractSafeForAirGap = false,
  } = submergeParams
  const mixCommands = []
  for (let i = 0; i < mixTimes; i++) {
    mixCommands.push(
      ...[
        {
          commandType: 'aspirateInPlace',
          key: expect.any(String),
          params: {
            pipetteId,
            volume: mixVolume,
            flowRate: aspirateFlowRate,
          },
        },
        ...(aspirateDelay > 0
          ? [
              {
                commandType: 'waitForDuration',
                key: expect.any(String),
                params: { seconds: aspirateDelay },
              },
            ]
          : []),
        {
          commandType: 'dispenseInPlace',
          key: expect.any(String),
          params: {
            pipetteId,
            volume: mixVolume,
            flowRate: dispenseFlowRate,
            pushOut: 0,
          },
        },
        ...(dispenseDelay > 0
          ? [
              {
                commandType: 'waitForDuration',
                key: expect.any(String),
                params: { seconds: dispenseDelay },
              },
            ]
          : []),
      ]
    )
  }
  return [
    {
      commandType: 'moveToWell',
      key: expect.any(String),
      params: {
        pipetteId,
        labwareId,
        wellName,
        wellLocation: SAFE_MOVE_TO_WELL_LOCATION,
      },
    },
    ...(dispenseAirGap > 0
      ? [
          {
            commandType: 'dispenseInPlace',
            key: expect.any(String),
            params: {
              pipetteId,
              volume: dispenseAirGap,
              flowRate: dispenseFlowRate,
            },
            meta: AIR_GAP_META,
          },
          ...(dispenseDelay > 0
            ? [
                {
                  commandType: 'waitForDuration',
                  key: expect.any(String),
                  params: { seconds: dispenseDelay },
                },
              ]
            : []),
        ]
      : []),
    // ...(shouldProbe
    //   ? [
    //       {
    //         commandType: 'liquidProbe',
    //         key: expect.any(String),
    //         params: {
    //           pipetteId,
    //           labwareId,
    //           wellName,
    //           wellLocation: {
    //             origin: WELL_ORIGIN_TOP,
    //             offset: {
    //               x: 0,
    //               y: 0,
    //               z: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    //             },
    //           },
    //         },
    //       },
    //     ]
    //   : []),
    {
      commandType: 'prepareToAspirate',
      key: expect.any(String),
      params: {
        pipetteId,
      },
    },
    {
      commandType: 'moveToWell',
      key: expect.any(String),
      params: {
        pipetteId,
        labwareId,
        wellName,
        wellLocation: submergeLocation,
      },
    },
    {
      commandType: 'moveToWell',
      key: expect.any(String),
      params: {
        pipetteId,
        labwareId: SOURCE_LABWARE,
        speed: submergeSpeed,
        wellName,
        wellLocation: aspirateLocation,
      },
    },
    ...(submergeDelay > 0
      ? [
          {
            commandType: 'waitForDuration',
            key: expect.any(String),
            params: { seconds: submergeDelay },
          },
        ]
      : []),

    ...(mixTimes > 0 ? mixCommands : []),
    ...(shouldPreWet
      ? [
          {
            commandType: 'aspirateInPlace',
            key: expect.any(String),
            params: {
              pipetteId,
              volume,
              flowRate: aspirateFlowRate,
            },
          },
          ...(aspirateDelay > 0
            ? [
                {
                  commandType: 'waitForDuration',
                  key: expect.any(String),
                  params: { seconds: aspirateDelay },
                },
              ]
            : []),
          {
            commandType: 'dispenseInPlace',
            key: expect.any(String),
            params: {
              pipetteId,
              volume,
              flowRate: dispenseFlowRate,
              pushOut: 0,
            },
          },
          ...(dispenseDelay > 0
            ? [
                {
                  commandType: 'waitForDuration',
                  key: expect.any(String),
                  params: { seconds: dispenseDelay },
                },
              ]
            : []),
        ]
      : []),
    {
      commandType: 'aspirateInPlace',
      key: expect.any(String),
      params: {
        pipetteId: 'p300SingleId',
        volume,
        flowRate: aspirateFlowRate,
      },
    },
    ...(aspirateDelay > 0
      ? [
          {
            commandType: 'waitForDuration',
            key: expect.any(String),
            params: { seconds: aspirateDelay },
          },
        ]
      : []),

    {
      commandType: 'moveToWell',
      key: expect.any(String),
      params: {
        pipetteId: 'p300SingleId',
        labwareId: SOURCE_LABWARE,
        speed: retractSpeed,
        wellName,
        wellLocation: retractLocation,
      },
    },
    ...(retractDelay > 0
      ? [
          {
            commandType: 'waitForDuration',
            key: expect.any(String),
            params: { seconds: retractDelay },
          },
        ]
      : []),
    ...(shouldTouchTip
      ? [
          {
            commandType: 'touchTip',
            key: expect.any(String),
            params: {
              pipetteId: 'p300SingleId',
              labwareId: SOURCE_LABWARE,
              wellName,
              wellLocation: {
                origin: WELL_ORIGIN_TOP,
                offset: {
                  z: touchTipMmFromTop,
                },
              },
              mmFromEdge: touchTipMmFromEdge,
              speed: touchTipSpeed,
            },
          },
        ]
      : []),
    ...(aspirateAirGap > 0
      ? [
          {
            commandType: 'moveToWell',
            key: expect.any(String),
            params: {
              pipetteId: 'p300SingleId',
              labwareId: SOURCE_LABWARE,
              wellName,
              wellLocation: isRetractSafeForAirGap
                ? retractLocation
                : SAFE_MOVE_TO_WELL_LOCATION,
            },
          },
          {
            commandType: 'airGapInPlace',
            key: expect.any(String),
            params: {
              pipetteId,
              volume: aspirateAirGap,
              flowRate: aspirateFlowRate,
            },
          },
          ...(aspirateDelay > 0
            ? [
                {
                  commandType: 'waitForDuration',
                  key: expect.any(String),
                  params: { seconds: aspirateDelay },
                },
              ]
            : []),
        ]
      : []),
  ]
}

export const blowoutInTrashCommands = (args: {
  pipetteId: string
  addressableAreaName: string
  blowoutFlowRate: number
  dispenseAirGap?: number
  aspirateDelay?: number
  aspirateFlowRate?: number
}) => {
  const {
    pipetteId,
    addressableAreaName,
    blowoutFlowRate,
    aspirateDelay = 0,
    dispenseAirGap = 0,
    aspirateFlowRate,
  } = args
  return [
    {
      commandType: 'moveToAddressableArea',
      key: expect.any(String),
      params: {
        pipetteId,
        addressableAreaName,
        offset: {
          x: 0,
          y: 0,
          z: 0,
        },
      },
    },
    {
      commandType: 'blowOutInPlace',
      key: expect.any(String),
      params: {
        pipetteId,
        flowRate: blowoutFlowRate,
      },
    },
    ...(dispenseAirGap > 0
      ? [
          {
            commandType: 'airGapInPlace',
            key: expect.any(String),
            params: {
              pipetteId,
              volume: dispenseAirGap,
              ...(aspirateFlowRate != null
                ? { flowRate: aspirateFlowRate }
                : {}),
            },
          },
          ...(aspirateDelay > 0
            ? [
                {
                  commandType: 'waitForDuration',
                  key: expect.any(String),
                  params: { seconds: aspirateDelay },
                },
              ]
            : []),
        ]
      : []),
  ]
}

export const dispenseHelperLiquidClass = (params: {
  pipetteId: string
  labwareId: string
  wellName: string
  volume: number
  submergeSpeed: number
  retractSpeed: number
  dispenseFlowRate: number
  submergeLocation: WellLocation
  dispenseLocation: WellLocation
  retractLocation: WellLocation
  aspirateFlowRate?: number
  aspirateAirGap?: number
  dispenseAirGap?: number
  shouldTouchTip?: boolean
  submergeDelay?: number
  aspirateDelay?: number
  retractDelay?: number
  dispenseDelay?: number
  mixTimes?: number
  mixVolume?: number
  touchTipMmFromTop?: number
  touchTipMmFromEdge?: number
  touchTipSpeed?: number
  pushOut?: number
  shouldBlowoutInDestination?: boolean
  blowoutFlowRate?: number
  isRetractSafeForAirGap?: boolean
}) => {
  const {
    volume,
    aspirateFlowRate,
    dispenseFlowRate,
    submergeSpeed,
    retractSpeed,
    pipetteId,
    labwareId,
    wellName,
    submergeLocation,
    dispenseLocation,
    retractLocation,
    shouldTouchTip = false,
    submergeDelay = 0,
    aspirateDelay = 0,
    retractDelay = 0,
    dispenseDelay = 0,
    mixTimes = 0,
    mixVolume = 0,
    aspirateAirGap = 0,
    dispenseAirGap = 0,
    touchTipMmFromTop,
    touchTipMmFromEdge,
    touchTipSpeed,
    pushOut,
    shouldBlowoutInDestination = false,
    blowoutFlowRate,
    isRetractSafeForAirGap = false,
  } = params
  const mixCommands = []
  for (let i = 0; i < mixTimes; i++) {
    mixCommands.push(
      ...[
        {
          commandType: 'aspirateInPlace',
          key: expect.any(String),
          params: {
            pipetteId,
            volume: mixVolume,
            flowRate: aspirateFlowRate,
          },
        },
        ...(aspirateDelay > 0
          ? [
              {
                commandType: 'waitForDuration',
                key: expect.any(String),
                params: { seconds: aspirateDelay },
              },
            ]
          : []),
        {
          commandType: 'dispenseInPlace',
          key: expect.any(String),
          params: {
            pipetteId,
            volume: mixVolume,
            flowRate: dispenseFlowRate,
            ...(i === mixTimes - 1 ? { pushOut } : { pushOut: 0 }),
          },
        },
        ...(dispenseDelay > 0
          ? [
              {
                commandType: 'waitForDuration',
                key: expect.any(String),
                params: { seconds: dispenseDelay },
              },
            ]
          : []),
      ]
    )
  }
  const effectivePushOut = mixTimes > 0 ? 0 : pushOut
  return [
    {
      commandType: 'moveToWell',
      key: expect.any(String),
      params: {
        pipetteId,
        labwareId,
        wellName,
        wellLocation: submergeLocation,
      },
    },
    ...(aspirateAirGap > 0
      ? [
          {
            commandType: 'dispenseInPlace',
            key: expect.any(String),
            params: {
              pipetteId,
              volume: aspirateAirGap,
              flowRate: dispenseFlowRate,
              pushOut: 0,
            },
            meta: AIR_GAP_META,
          },
          ...(dispenseDelay > 0
            ? [
                {
                  commandType: 'waitForDuration',
                  key: expect.any(String),
                  params: {
                    seconds: dispenseDelay,
                  },
                },
              ]
            : []),
        ]
      : []),
    {
      commandType: 'moveToWell',
      key: expect.any(String),
      params: {
        pipetteId,
        labwareId,
        speed: submergeSpeed,
        wellName,
        wellLocation: dispenseLocation,
      },
    },
    ...(submergeDelay > 0
      ? [
          {
            commandType: 'waitForDuration',
            key: expect.any(String),
            params: { seconds: submergeDelay },
          },
        ]
      : []),
    {
      commandType: 'dispenseInPlace',
      key: expect.any(String),
      params: {
        pipetteId: 'p300SingleId',
        volume,
        flowRate: dispenseFlowRate,
        ...(effectivePushOut != null ? { pushOut: effectivePushOut } : {}),
      },
    },
    ...(dispenseDelay > 0
      ? [
          {
            commandType: 'waitForDuration',
            key: expect.any(String),
            params: { seconds: dispenseDelay },
          },
        ]
      : []),
    ...(mixTimes > 0 ? mixCommands : []),
    {
      commandType: 'moveToWell',
      key: expect.any(String),
      params: {
        pipetteId,
        labwareId,
        speed: retractSpeed,
        wellName,
        wellLocation: retractLocation,
      },
    },
    ...(retractDelay > 0
      ? [
          {
            commandType: 'waitForDuration',
            key: expect.any(String),
            params: { seconds: retractDelay },
          },
        ]
      : []),
    ...(shouldBlowoutInDestination
      ? [
          {
            commandType: 'blowOutInPlace',
            key: expect.any(String),
            params: { pipetteId, flowRate: blowoutFlowRate },
          },
        ]
      : []),
    ...(shouldTouchTip
      ? [
          {
            commandType: 'touchTip',
            key: expect.any(String),
            params: {
              pipetteId,
              labwareId,
              wellName,
              wellLocation: {
                origin: WELL_ORIGIN_TOP,
                offset: {
                  z: touchTipMmFromTop,
                },
              },
              mmFromEdge: touchTipMmFromEdge,
              speed: touchTipSpeed,
            },
          },
        ]
      : []),
    ...(dispenseAirGap > 0
      ? [
          {
            commandType: 'moveToWell',
            key: expect.any(String),
            params: {
              pipetteId: 'p300SingleId',
              labwareId,
              wellName,
              wellLocation: isRetractSafeForAirGap
                ? retractLocation
                : SAFE_MOVE_TO_WELL_LOCATION,
            },
          },
          {
            commandType: 'airGapInPlace',
            key: expect.any(String),
            params: {
              pipetteId,
              flowRate: aspirateFlowRate,
              volume: dispenseAirGap,
            },
          },
          ...(aspirateDelay > 0
            ? [
                {
                  commandType: 'waitForDuration',
                  key: expect.any(String),
                  params: { seconds: aspirateDelay },
                },
              ]
            : []),
        ]
      : []),
  ]
}

export const makeMoveToWellHelper = (wellName: string, labwareId?: string) => ({
  commandType: 'moveToWell',
  key: expect.any(String),
  params: {
    pipetteId: DEFAULT_PIPETTE,
    labwareId: labwareId ?? SOURCE_LABWARE,
    wellName,
    wellLocation: {
      origin: 'top',
      offset: {
        x: 0,
        y: 0,
        z: AIR_GAP_OFFSET_FROM_TOP,
      },
    },
  },
})
export const makeAirGapAfterAspirateHelper = (
  volume: number,
  flowRate?: number
) => ({
  commandType: 'airGapInPlace',
  key: expect.any(String),
  params: {
    pipetteId: DEFAULT_PIPETTE,
    volume,
    flowRate: flowRate ?? ASPIRATE_FLOW_RATE,
  },
})
export const makeAirGapHelper = (volume: number, flowRate?: number) => [
  {
    commandType: 'prepareToAspirate',
    key: expect.any(String),
    params: {
      pipetteId: DEFAULT_PIPETTE,
    },
  },
  {
    commandType: 'airGapInPlace',
    key: expect.any(String),
    params: {
      pipetteId: DEFAULT_PIPETTE,
      volume,
      flowRate: flowRate ?? ASPIRATE_FLOW_RATE,
    },
  },
]

export const blowoutHelper = (
  labware: string,
  params?: Partial<BlowoutParams>
): CreateCommand => ({
  commandType: 'blowout',
  key: expect.any(String),
  params: {
    pipetteId: DEFAULT_PIPETTE,
    labwareId: labware,
    wellName: DEFAULT_BLOWOUT_WELL,
    wellLocation: {
      origin: 'bottom',
      offset: {
        z: BLOWOUT_OFFSET_FROM_TOP_MM,
      },
    },
    // TODO IMMEDIATELY
    flowRate: BLOWOUT_FLOW_RATE,
    ...params,
  },
})
export const blowoutInPlaceHelper = (): CreateCommand[] => [
  {
    commandType: 'moveToAddressableArea',
    key: expect.any(String),
    params: {
      pipetteId: 'p300SingleId',
      addressableAreaName: 'movableTrashA3',
      offset: { x: 0, y: 0, z: 0 },
    },
  },
  {
    commandType: 'blowOutInPlace',
    key: expect.any(String),
    params: {
      pipetteId: 'p300SingleId',
      flowRate: 2.3,
    },
  },
]
const _defaultDispenseParams = {
  pipetteId: DEFAULT_PIPETTE,
  labwareId: DEST_LABWARE,
  wellLocation: {
    origin: 'bottom' as const,
    offset: {
      y: 0,
      x: 0,
      z: DISPENSE_OFFSET_FROM_BOTTOM_MM,
    },
  },
  flowRate: DISPENSE_FLOW_RATE,
}
export const makeDispenseHelper: MakeAspDispHelper<DispenseParams> = bakedParams => (
  wellName,
  volume,
  params
) => ({
  commandType: 'dispense',
  key: expect.any(String),
  params: {
    ..._defaultDispenseParams,
    ...bakedParams,
    wellName,
    volume,
    ...params,
  },
})
export const makeDispenseAirGapHelper = (
  wellName: string,
  volume: number
): CreateCommand => ({
  commandType: 'dispense',
  key: expect.any(String),
  params: {
    pipetteId: DEFAULT_PIPETTE,
    labwareId: DEST_LABWARE,
    wellLocation: {
      origin: 'top' as const,
      offset: {
        y: 0,
        x: 0,
        z: 1,
      },
    },
    flowRate: DISPENSE_FLOW_RATE,
    wellName,
    volume,
  },
  meta: AIR_GAP_META,
})
const _defaultTouchTipParams = {
  pipetteId: DEFAULT_PIPETTE,
  labwareId: SOURCE_LABWARE,
  wellLocation: {
    origin: 'top' as const,
    offset: {
      z: TOUCH_TIP_OFFSET_FROM_TOP_MM,
    },
  },
}
type MakeTouchTipHelper = (
  bakedParams?: Partial<TouchTipParams>
) => (wellName: string, params?: Partial<TouchTipParams>) => CreateCommand
export const makeTouchTipHelper: MakeTouchTipHelper = bakedParams => (
  wellName,
  params
) => ({
  commandType: 'touchTip',
  key: expect.any(String),
  params: { ..._defaultTouchTipParams, ...bakedParams, wellName, ...params },
})
export const delayCommand = (
  seconds: number,
  message?: string
): CreateCommand => ({
  commandType: 'waitForDuration',
  key: expect.any(String),
  params: {
    seconds: seconds,
    message,
  },
})
export const delayWithOffset = (
  wellName: string,
  labwareId: string,
  seconds?: number,
  zOffset?: number,
  forceDirect?: boolean,
  minimumZHeight?: number,
  message?: string
): CreateCommand[] => [
  {
    commandType: 'moveToWell',
    key: expect.any(String),
    params: {
      pipetteId: DEFAULT_PIPETTE,
      labwareId,
      wellName,
      wellLocation: {
        origin: 'bottom',
        offset: {
          x: 0,
          y: 0,
          z: zOffset || 14,
        },
      },
      forceDirect,
      minimumZHeight,
    },
  },
  {
    commandType: 'waitForDuration',
    key: expect.any(String),
    params: {
      seconds: seconds ?? 12,
      message,
    },
  },
]
// =================
export const dropTipHelper = (pipette?: string): CreateCommand[] => [
  {
    commandType: 'moveToAddressableAreaForDropTip',
    key: expect.any(String),
    params: {
      pipetteId: pipette ?? DEFAULT_PIPETTE,
      addressableAreaName: 'movableTrashA3',
      offset: { x: 0, y: 0, z: 0 },
      alternateDropLocation: true,
    },
  },
  {
    commandType: 'dropTipInPlace',
    key: expect.any(String),
    params: {
      pipetteId: pipette ?? DEFAULT_PIPETTE,
    },
  },
]
export const dropTipIntoWasteChuteHelper = (
  pipette?: string
): CreateCommand[] => [
  {
    commandType: 'moveToAddressableArea',
    key: expect.any(String),
    params: {
      pipetteId: pipette ?? DEFAULT_PIPETTE,
      addressableAreaName: 'movableTrashA3',
      offset: { x: 0, y: 0, z: 0 },
    },
  },
  {
    commandType: 'dropTipInPlace',
    key: expect.any(String),
    params: {
      pipetteId: pipette ?? DEFAULT_PIPETTE,
    },
  },
]
export const pickUpTipHelper = (
  tip: number | string,
  params?: {
    pipetteId?: string
    labwareId?: string
  }
): CreateCommand => ({
  commandType: 'pickUpTip',
  key: expect.any(String),
  params: {
    pipetteId: DEFAULT_PIPETTE,
    labwareId: 'tiprack1Id',
    ...params,
    wellName: typeof tip === 'string' ? tip : tiprackWellNamesFlat[tip],
  },
})
export const dropTipInPlaceHelper = (params?: {
  pipetteId?: string
}): CreateCommand => ({
  commandType: 'dropTipInPlace',
  key: expect.any(String),
  params: {
    pipetteId: DEFAULT_PIPETTE,
    ...params,
  },
})
export const moveToAddressableAreaHelper = (params?: {
  pipetteId?: string
  addressableAreaName: AddressableAreaName
}): CreateCommand => ({
  commandType: 'moveToAddressableArea',
  key: expect.any(String),
  params: {
    pipetteId: DEFAULT_PIPETTE,
    addressableAreaName: ONE_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA,
    offset: { x: 0, y: 0, z: 0 },
    ...params,
  },
})
