// @flow
import {getLabware} from '@opentrons/labware-definitions'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import range from 'lodash/range'
import reduce from 'lodash/reduce'
import {tiprackWellNamesFlat} from '../'
import type {RobotState, PipetteData, LabwareData} from '../'

// Eg {A1: true, B1: true, ...}
type WellTipState = {[wellName: string]: boolean}
export function getTiprackTipstate (filled: ?boolean): WellTipState {
  return tiprackWellNamesFlat.reduce(
    (acc, wellName) => ({...acc, [wellName]: !!filled}),
    {}
  )
}

// Eg A2 B2 C2 D2 E2 F2 G2 H2 keys
export function getTipColumn<T> (index: number, filled: T): {[well: string]: T} {
  return Array.from('ABCDEFGH').map(wellLetter => `${wellLetter}${index}`).reduce((acc, well) => ({
    ...acc,
    [well]: filled
  }), {})
}

export const all8ChTipIds = range(8)

export function createTipLiquidState<T> (channels: number, contents: T): {[tipId: string]: T} {
  return range(channels).reduce((tipIdAcc, tipId) => ({
    ...tipIdAcc,
    [tipId]: contents
  }), {})
}

// TODO Ian 2018-03-14: these pipette fixtures should use file-data/pipetteData.js,
// which should in turn be lifted out to a general pipette data project?
export const p300Single = {
  id: 'p300SingleId',
  mount: 'right',
  maxVolume: 300,
  channels: 1
}

export const p300Multi = {
  id: 'p300MultiId',
  mount: 'left',
  maxVolume: 300,
  channels: 8
}

export function getWellsForLabware (labwareType: string) {
  const labware = getLabware(labwareType)
  if (!labware) {
    throw new Error(`Labware "${labwareType}" not found.`)
  }
  if (!labware.wells) {
    throw new Error(`Labware "${labwareType} has no wells!"`)
  }
  return labware.wells
}

export function createEmptyLiquidState (args: {
  sourcePlateType: string,
  destPlateType: string,
  pipettes: $PropertyType<RobotState, 'instruments'>
}) {
  const {sourcePlateType, destPlateType, pipettes} = args
  return {
    pipettes: reduce(
      pipettes,
      (acc, pipetteData: PipetteData, pipetteId: string) => ({
        ...acc,
        [pipetteId]: createTipLiquidState(pipetteData.channels, {})
      }), {}),
    labware: {
      sourcePlateId: mapValues(getWellsForLabware(sourcePlateType), () => ({})),
      destPlateId: mapValues(getWellsForLabware(destPlateType), () => ({})),
      trashId: {A1: {}}
    }
  }
}

type SubtractLiquidState = {liquidState: *}
type RobotStateNoLiquidState = $Diff<RobotState, SubtractLiquidState>

type CreateRobotArgs = {
  sourcePlateType: string,
  destPlateType: string,
  tipracks: Array<10 | 200 | 1000>,
  fillPipetteTips?: boolean,
  fillTiprackTips?: boolean
}
/** RobotState with empty liquid state */
export function createRobotState (args: CreateRobotArgs): RobotState {
  const {labware, instruments, tipState} = createRobotStateFixture(args)

  return {
    labware,
    instruments,
    tipState,
    liquidState: createEmptyLiquidState({
      ...args,
      pipettes: {p300SingleId: p300Single, p300MultiId: p300Multi}
    })
  }
}

/** RobotState without liquidState key, for use with jest's `toMatchObject` */
export function createRobotStateFixture (args: CreateRobotArgs): RobotStateNoLiquidState {
  function _getTiprackSlot (tiprackIndex: number, occupiedSlots: Array<string>): string {
    const slot = (tiprackIndex + 1).toString()
    if (occupiedSlots.includes(slot)) {
      throw new Error(`Cannot create tiprack at slot ${slot}, slot is occupied by other labware`)
    }
    return slot.toString()
  }

  const instruments = {
    p300SingleId: p300Single,
    p300MultiId: p300Multi
  }

  const baseLabware = {
    sourcePlateId: {
      slot: '10',
      type: args.sourcePlateType,
      name: 'Source Plate'
    },
    destPlateId: {
      slot: '11',
      type: args.destPlateType,
      name: 'Destination Plate'
    },
    trashId: {
      slot: '12',
      type: 'fixed-trash',
      name: 'Trash'
    }
  }

  const occupiedSlots = map(baseLabware, (labwareData: LabwareData, labwareId) => labwareData.slot)

  const tiprackLabware = args.tipracks.reduce((acc, tiprackVolume, tiprackIndex) => ({
    ...acc,
    [`tiprack${tiprackIndex + 1}Id`]: {
      slot: _getTiprackSlot(tiprackIndex, occupiedSlots),
      type: `tiprack-${tiprackVolume}ul`,
      name: `Tip rack ${tiprackIndex + 1}`
    }
  }), {})

  return {
    instruments,

    labware: {
      ...baseLabware,
      ...tiprackLabware
    },

    tipState: {
      tipracks: Object.keys(tiprackLabware).reduce((acc, tiprackId) => ({
        ...acc,
        [tiprackId]: getTiprackTipstate(args.fillTiprackTips)
      }), {}),
      pipettes: {
        p300SingleId: !!args.fillPipetteTips,
        p300MultiId: !!args.fillPipetteTips
      }
    }
  }
}
