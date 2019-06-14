// @flow
import { tiprackWellNamesFlat } from './data'
import type {
  AspirateArgsV3,
  BlowoutArgsV3,
  DispenseArgsV3,
  TouchTipArgsV3,
  CommandV3 as Command,
} from '@opentrons/shared-data'

export const replaceTipCommands = (tip: number | string): Array<Command> => [
  dropTipHelper('A1'),
  pickUpTipHelper(tip),
]

// NOTE: make sure none of these numbers match each other!
const ASPIRATE_FLOW_RATE = 2.1
const DISPENSE_FLOW_RATE = 2.2
export const BLOWOUT_FLOW_RATE = 2.3

const ASPIRATE_OFFSET_FROM_BOTTOM_MM = 3.1
const DISPENSE_OFFSET_FROM_BOTTOM_MM = 3.2
export const BLOWOUT_OFFSET_FROM_TOP_MM = 3.3
const TOUCH_TIP_OFFSET_FROM_BOTTOM_MM = 3.4

export const getFlowRateAndOffsetParams = () => ({
  aspirateFlowRateUlSec: ASPIRATE_FLOW_RATE,
  dispenseFlowRateUlSec: DISPENSE_FLOW_RATE,
  blowoutFlowRateUlSec: BLOWOUT_FLOW_RATE,
  aspirateOffsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
  dispenseOffsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
  blowoutOffsetFromTopMm: BLOWOUT_OFFSET_FROM_TOP_MM,

  // for consolidate/distribute/transfer only
  touchTipAfterAspirateOffsetMmFromBottom: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,
  touchTipAfterDispenseOffsetMmFromBottom: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,

  // for mix only
  touchTipMmFromBottom: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,
})

// =================

export const DEFAULT_PIPETTE = 'p300SingleId'
export const SOURCE_LABWARE = 'sourcePlateId'
export const DEST_LABWARE = 'destPlateId'
export const TROUGH_LABWARE = 'troughId'
export const FIXED_TRASH_ID = 'trashId'
export const DEFAULT_BLOWOUT_WELL = 'A1'

// =================

const _defaultAspirateParams = {
  pipette: DEFAULT_PIPETTE,
  labware: SOURCE_LABWARE,
}
export const makeAspirateHelper = (bakedParams?: $Shape<AspirateArgsV3>) => (
  well: string,
  volume: number,
  params?: $Shape<AspirateArgsV3>
): Command => ({
  command: 'aspirate',
  params: {
    ..._defaultAspirateParams,
    ...bakedParams,
    well,
    volume,
    offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
    flowRate: ASPIRATE_FLOW_RATE,
    ...params,
  },
})

export const blowoutHelper = (
  labware?: ?string,
  params?: $Shape<BlowoutArgsV3>
): Command => ({
  command: 'blowout',
  params: {
    pipette: DEFAULT_PIPETTE,
    labware: labware || FIXED_TRASH_ID,
    well: DEFAULT_BLOWOUT_WELL,
    offsetFromBottomMm: BLOWOUT_OFFSET_FROM_TOP_MM, // TODO IMMEDIATELY
    flowRate: BLOWOUT_FLOW_RATE,
    ...params,
  },
})

const _defaultDispenseParams = {
  pipette: DEFAULT_PIPETTE,
  labware: DEST_LABWARE,
  offsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
  flowRate: DISPENSE_FLOW_RATE,
}
export const makeDispenseHelper = (bakedParams?: $Shape<DispenseArgsV3>) => (
  well: string,
  volume: number,
  params?: $Shape<DispenseArgsV3>
): Command => ({
  command: 'dispense',
  params: {
    ..._defaultDispenseParams,
    ...bakedParams,
    well,
    volume,
    ...params,
  },
})

const _defaultTouchTipParams = {
  pipette: DEFAULT_PIPETTE,
  labware: SOURCE_LABWARE,
  offsetFromBottomMm: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,
}
export const makeTouchTipHelper = (bakedParams?: $Shape<TouchTipArgsV3>) => (
  well: string,
  params?: $Shape<TouchTipArgsV3>
): Command => ({
  command: 'touchTip',
  params: {
    ..._defaultTouchTipParams,
    ...bakedParams,
    well,
    ...params,
  },
})

// =================

export const dropTipHelper = (
  well: string,
  params?: {| pipette?: string, labware?: string |}
): Command => ({
  command: 'dropTip',
  params: {
    pipette: DEFAULT_PIPETTE,
    labware: FIXED_TRASH_ID,
    well: typeof well === 'string' ? well : tiprackWellNamesFlat[well],
    ...params,
  },
})

export const pickUpTipHelper = (
  tip: number | string,
  params?: {| pipette?: string, labware?: string |}
): Command => ({
  command: 'pickUpTip',
  params: {
    pipette: DEFAULT_PIPETTE,
    labware: 'tiprack1Id',
    ...params,
    well: typeof tip === 'string' ? tip : tiprackWellNamesFlat[tip],
  },
})
