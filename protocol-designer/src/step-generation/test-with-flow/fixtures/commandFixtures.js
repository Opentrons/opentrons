// @flow
import { tiprackWellNamesFlat } from './data'
import type {
  AspirateArgsV3,
  DispenseArgsV3,
  CommandV3 as Command,
} from '@opentrons/shared-data'

export const replaceTipCommands = (tip: number | string): Array<Command> => [
  dropTip('A1'),
  pickUpTip(tip),
]

// NOTE: make sure none of these numbers match each other!
const ASPIRATE_FLOW_RATE = 2.1
const DISPENSE_FLOW_RATE = 2.2
const BLOWOUT_FLOW_RATE = 2.3

const ASPIRATE_OFFSET_FROM_BOTTOM_MM = 3.1
const DISPENSE_OFFSET_FROM_BOTTOM_MM = 3.2
const BLOWOUT_OFFSET_FROM_BOTTOM_MM = 3.3
const TOUCH_TIP_OFFSET_FROM_BOTTOM_MM = 3.4

export const getFlowRateAndOffsetParams = () => ({
  aspirateFlowRateUlSec: ASPIRATE_FLOW_RATE,
  dispenseFlowRateUlSec: DISPENSE_FLOW_RATE,
  blowoutFlowRateUlSec: BLOWOUT_FLOW_RATE,
  aspirateOffsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
  dispenseOffsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
  blowoutOffsetFromBottomMm: BLOWOUT_OFFSET_FROM_BOTTOM_MM,

  // for consolidate/distribute/transfer only
  touchTipAfterAspirateOffsetMmFromBottom: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,
  touchTipAfterDispenseOffsetMmFromBottom: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,

  // for mix only
  touchTipMmFromBottom: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,
})

// =================

// TODO IMMEDIATELY replace all uses of these hard-coded strings in tests with these variables
export const DEFAULT_PIPETTE = 'p300SingleId'
export const SOURCE_LABWARE = 'sourcePlateId'
export const DEST_LABWARE = 'destPlateId'
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
) => ({
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
  params?: {|
    offsetFromBottomMm?: number,
    flowRate?: number,
    pipette?: string,
    well?: string, // TODO IMMEDIATELY use $Shape?
  |}
) => ({
  command: 'blowout',
  params: {
    pipette: DEFAULT_PIPETTE,
    labware: labware || FIXED_TRASH_ID,
    well: DEFAULT_BLOWOUT_WELL,
    offsetFromBottomMm: BLOWOUT_OFFSET_FROM_BOTTOM_MM,
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
) => ({
  command: 'dispense',
  params: {
    ..._defaultDispenseParams,
    ...bakedParams,
    well,
    volume,
    ...params,
  },
})

export const touchTipHelper = (
  well: string,
  params?: {| offsetFromBottomMm?: number, labware?: string |}
) => ({
  command: 'touchTip',
  params: {
    pipette: DEFAULT_PIPETTE,
    labware: SOURCE_LABWARE, // TODO IMMEDIATELY: don't hard-code here. Required arg???
    offsetFromBottomMm: TOUCH_TIP_OFFSET_FROM_BOTTOM_MM,
    well,
    ...params,
  },
})

// =================

// TODO IMMEDIATELY: make a factory that bakes args into these fns, don't bake them in here...???

export const dropTip = (
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

export const pickUpTip = (
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

// TODO IMMEDIATELY: remove
export const touchTip = (
  well: string,
  params: {| offsetFromBottomMm: number, labware?: string |}
): Command => ({
  command: 'touchTip',
  params: {
    labware: SOURCE_LABWARE,
    pipette: DEFAULT_PIPETTE,
    ...params,
    well,
  },
})

// TODO IMMEDIATELY: remove
export const aspirate = (
  well: string,
  volume: number,
  params?: $Shape<AspirateArgsV3>
): Command => ({
  command: 'aspirate',
  params: {
    pipette: DEFAULT_PIPETTE,
    labware: SOURCE_LABWARE,
    volume,
    well,
    ...params,
  },
})

// TODO IMMEDIATELY: remove
export const dispense = (
  well: string,
  volume: number,
  params?: $Shape<DispenseArgsV3>
): Command => ({
  command: 'dispense',
  params: {
    pipette: DEFAULT_PIPETTE,
    labware: SOURCE_LABWARE,
    volume,
    well,
    ...params,
  },
})

// TODO IMMEDIATELY: remove
export const blowout = (
  labware?: string,
  params?: {|
    offsetFromBottomMm: number,
    flowRate: number,
    pipette?: string,
    well?: string,
  |}
): Command => ({
  command: 'blowout',
  params: {
    pipette: DEFAULT_PIPETTE,
    well: 'A1',
    labware: labware || FIXED_TRASH_ID,
    ...params,
  },
})
