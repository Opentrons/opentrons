import { FIXED_TRASH_ID } from '../constants'
import { tiprackWellNamesFlat } from './data'
import type { CreateCommand } from '@opentrons/shared-data'
import type {
  AspDispAirgapParams,
  BlowoutParams,
  TouchTipParams,
} from '@opentrons/shared-data/protocol/types/schemaV7/command/pipetting'
import type { CommandsAndWarnings, CommandCreatorErrorResponse } from '../types'

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
  dropTipHelper('A1'),
  pickUpTipHelper(tip),
]
// NOTE: make sure none of these numbers match each other!
const ASPIRATE_FLOW_RATE = 2.1
const DISPENSE_FLOW_RATE = 2.2
export const BLOWOUT_FLOW_RATE = 2.3
export const ASPIRATE_OFFSET_FROM_BOTTOM_MM = 3.1
export const DISPENSE_OFFSET_FROM_BOTTOM_MM = 3.2
export const BLOWOUT_OFFSET_FROM_TOP_MM = 3.3
const TOUCH_TIP_OFFSET_FROM_BOTTOM_MM = 3.4
interface FlowRateAndOffsetParamsTransferlike {
  aspirateFlowRateUlSec: number
  dispenseFlowRateUlSec: number
  blowoutFlowRateUlSec: number
  aspirateOffsetFromBottomMm: number
  dispenseOffsetFromBottomMm: number
  blowoutOffsetFromTopMm: number
  touchTipAfterAspirateOffsetMmFromBottom: number
  touchTipAfterDispenseOffsetMmFromBottom: number
}
export const getFlowRateAndOffsetParamsTransferLike = (): FlowRateAndOffsetParamsTransferlike => ({
  aspirateFlowRateUlSec: ASPIRATE_FLOW_RATE,
  dispenseFlowRateUlSec: DISPENSE_FLOW_RATE,
  blowoutFlowRateUlSec: BLOWOUT_FLOW_RATE,
  aspirateOffsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
  dispenseOffsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
  blowoutOffsetFromTopMm: BLOWOUT_OFFSET_FROM_TOP_MM,
  // for consolidate/distribute/transfer only
  touchTipAfterAspirateOffsetMmFromBottom: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,
  touchTipAfterDispenseOffsetMmFromBottom: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,
})
interface FlowRateAndOffsetParamsMix {
  aspirateFlowRateUlSec: number
  dispenseFlowRateUlSec: number
  blowoutFlowRateUlSec: number
  aspirateOffsetFromBottomMm: number
  dispenseOffsetFromBottomMm: number
  blowoutOffsetFromTopMm: number
  touchTipMmFromBottom: number
}
export const getFlowRateAndOffsetParamsMix = (): FlowRateAndOffsetParamsMix => ({
  aspirateFlowRateUlSec: ASPIRATE_FLOW_RATE,
  dispenseFlowRateUlSec: DISPENSE_FLOW_RATE,
  blowoutFlowRateUlSec: BLOWOUT_FLOW_RATE,
  aspirateOffsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
  dispenseOffsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
  blowoutOffsetFromTopMm: BLOWOUT_OFFSET_FROM_TOP_MM,
  // for mix only
  touchTipMmFromBottom: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,
})
// =================
export const DEFAULT_PIPETTE = 'p300SingleId'
export const MULTI_PIPETTE = 'p300MultiId'
export const SOURCE_LABWARE = 'sourcePlateId'
export const DEST_LABWARE = 'destPlateId'
export const TROUGH_LABWARE = 'troughId'
export const DEFAULT_BLOWOUT_WELL = 'A1'
export const AIR_GAP_META = { isAirGap: true } // to differentiate if the aspirate or dispense command is an air gap or not
// =================
type MakeAspDispHelper<P> = (
  bakedParams?: Partial<P>
) => (well: string, volume: number, params?: Partial<P>) => CreateCommand
type MakeAirGapHelper<P> = (
  bakedParams: Partial<P> & {
    wellLocation: {
      origin: 'bottom'
      offset: {
        z: number
      }
    }
  }
) => (well: string, volume: number, params?: Partial<P>) => CreateCommand
type MakeDispenseAirGapHelper<P> = MakeAirGapHelper<P>
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
        z: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
      },
    },
    flowRate: ASPIRATE_FLOW_RATE,
    ...params,
  },
})
export const makeAirGapHelper: MakeAirGapHelper<AspDispAirgapParams> = bakedParams => (
  wellName,
  volume,
  params
) => ({
  commandType: 'aspirate',
  meta: AIR_GAP_META,
  key: expect.any(String),
  params: {
    ..._defaultAspirateParams,
    ...bakedParams,
    wellName,
    volume,
    flowRate: ASPIRATE_FLOW_RATE,
    ...params,
  },
})
export const blowoutHelper = (
  labware?: string | null | undefined,
  params?: Partial<BlowoutParams>
): CreateCommand => ({
  commandType: 'blowout',
  key: expect.any(String),
  params: {
    pipetteId: DEFAULT_PIPETTE,
    labwareId: labware || FIXED_TRASH_ID,
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
const _defaultDispenseParams = {
  pipetteId: DEFAULT_PIPETTE,
  labwareId: DEST_LABWARE,
  wellLocation: {
    origin: 'bottom' as const,
    offset: {
      z: DISPENSE_OFFSET_FROM_BOTTOM_MM,
    },
  },
  flowRate: DISPENSE_FLOW_RATE,
}
export const makeDispenseHelper: MakeAspDispHelper<AspDispAirgapParams> = bakedParams => (
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
export const makeDispenseAirGapHelper: MakeDispenseAirGapHelper<AspDispAirgapParams> = bakedParams => (
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
  meta: AIR_GAP_META,
})
const _defaultTouchTipParams = {
  pipetteId: DEFAULT_PIPETTE,
  labwareId: SOURCE_LABWARE,
  wellLocation: {
    origin: 'bottom' as const,
    offset: {
      z: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,
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
export const delayCommand = (seconds: number): CreateCommand => ({
  commandType: 'waitForDuration',
  key: expect.any(String),
  params: {
    seconds: seconds,
  },
})
export const delayWithOffset = (
  wellName: string,
  labwareId: string,
  seconds?: number,
  zOffset?: number
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
    },
  },
  {
    commandType: 'waitForDuration',
    key: expect.any(String),
    params: {
      seconds: seconds ?? 12,
    },
  },
]
// =================
export const dropTipHelper = (
  wellName: string,
  params?: {
    pipetteId?: string
    labwareId?: string
  }
): CreateCommand => ({
  commandType: 'dropTip',
  key: expect.any(String),
  params: {
    pipetteId: DEFAULT_PIPETTE,
    labwareId: FIXED_TRASH_ID,
    wellName:
      typeof wellName === 'string' ? wellName : tiprackWellNamesFlat[wellName],
    ...params,
  },
})
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
