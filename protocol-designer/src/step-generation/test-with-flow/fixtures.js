// @flow
import {getLabware} from '@opentrons/labware-definitions'
import mapValues from 'lodash/mapValues'
import range from 'lodash/range'
import reduce from 'lodash/reduce'
import {tiprackWellNamesFlat} from '../'
import type {RobotState, PipetteData} from '../'

// export const wellNames96 = flatMap(
//   'ABCDEFGH'.split(''),
//   (letter): Array<string> => range(12).map(number => letter + (number + 1))
// )

// Eg {A1: true, B1: true, ...}
export const filledTiprackWells = tiprackWellNamesFlat.reduce(
  (acc, wellName) => ({...acc, [wellName]: true}),
  {}
)

export const emptyTiprackWells = tiprackWellNamesFlat.reduce(
  (acc, wellName) => ({...acc, [wellName]: false}),
  {}
)
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

export const all8ChTipIds = range(8)

// export const basicLiquidState = {
//   pipettes: {
//     p300SingleId: { '0': {} },
//     p300MultiId: all8ChTipIds.reduce((acc, tipId) => ({...acc, [tipId]: {}}), {})
//   },
//   labware: {
//     sourcePlateId: {
//       A1: {},
//       A2: {},
//       A3: {},
//       A4: {},
//       A5: {},
//       A6: {},
//       A7: {},
//       A8: {},
//       A9: {},
//       A10: {},
//       A11: {},
//       A12: {}
//     },
//     destPlateId: tiprackWellNamesFlat.reduce((acc, well) => ({
//       // Eg {A1: {}, B1: {}, ...etc}
//       [well]: {}
//     }), {}),
//     trashId: {
//       A1: {}
//     }
//   }
// }

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
        [pipetteId]: range(pipetteData.channels).reduce((tipIdAcc, tipId) => ({ // TODO: replace with helper fn
          ...tipIdAcc,
          [tipId]: {}
        }), {})
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

/** RobotState with empty liquid state */
export function createRobotState (args: {
  sourcePlateType: string,
  destPlateType: string,
  fillPipetteTips?: boolean,
  fillTiprackTips?: boolean
}): RobotState {
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
export function createRobotStateFixture (args: {
  sourcePlateType: string,
  destPlateType: string,
  fillPipetteTips?: boolean,
  fillTiprackTips?: boolean
}): RobotStateNoLiquidState {
  const instruments = {
    p300SingleId: p300Single,
    p300MultiId: p300Multi
  }

  return {
    instruments,
    labware: {
      tiprack1Id: {
        slot: '7',
        type: 'tiprack-200uL',
        name: 'Tip rack'
      },
      sourcePlateId: {
        slot: '10',
        type: args.sourcePlateType, // WAS: 'trough-12row'. TODO IMMEDIATELY: remove this comment
        name: 'Source (Buffer)'
      },
      destPlateId: {
        slot: '11',
        type: args.destPlateType, // WAS: '96-flat'. TODO IMMEDIATELY: remove this comment
        name: 'Destination Plate'
      },
      trashId: {
        slot: '12',
        type: 'fixed-trash',
        name: 'Trash'
      }
    },

    tipState: {
      tipracks: {
        tiprack1Id: args.fillTiprackTips ? filledTiprackWells : emptyTiprackWells
      },
      pipettes: {
        p300SingleId: !!args.fillPipetteTips,
        p300MultiId: !!args.fillPipetteTips
      }
    }
  }
}

// type SubtractMount = {mount: *}
//
// type PipetteNoMount = $Diff<PipetteData, SubtractMount>
//
// const _pipetteShortcuts: {[string]: PipetteNoMount} = {
//   'p300Single': {maxVolume: 300, channels: 1, id: 'p300Single'},
//   'p300Multi': {maxVolume: 300, channels: 8, id: 'p300Multi'},
//   'p10Single': {maxVolume: 10, channels: 1, id: 'p10Single'},
//   'p10Multi': {maxVolume: 10, channels: 8, id: 'p10Multi'}
// }
//
// export function createRobotState (args: { // TODO remove
//   labware: $PropertyType<RobotState, 'labware'>,
//   leftPipette?: $Keys<typeof _pipetteShortcuts>,
//   rightPipette?: $Keys<typeof _pipetteShortcuts>,
//   tiprackTips: 'full' | 'empty',
//   pipetteTips: 'full' | 'empty'
// }): RobotStateNoLiquidState {
//   const {labware, leftPipette, rightPipette, tiprackTips, pipetteTips} = args
//   // Construct instruments
//   let instruments = {}
//
//   if (leftPipette) {
//     instruments.left = {
//       ..._pipetteShortcuts[leftPipette],
//       mount: 'left'
//     }
//   }
//
//   if (rightPipette) {
//     instruments.right = {
//       ..._pipetteShortcuts[rightPipette],
//       mount: 'right'
//     }
//   }
//
//   // construct tipstate
//   const tipState = {
//     tipracks: reduce(
//       Object.keys(labware).filter(labwareName => labware[labwareName].type.startsWith('tiprack')),
//       (acc, tiprackId) => ({
//         ...acc,
//         [tiprackId]: tiprackTips === 'full'
//           ? {...filledTiprackWells}
//           : {...emptyTiprackWells}
//       }),
//       {}),
//     pipettes: reduce(
//       instruments,
//       (acc, pipette: PipetteNoMount, pipetteId) => ({
//         ...acc,
//         [pipetteId]: range(pipette.channels).reduce((tipAcc, tipIndex) => ({
//           ...tipAcc,
//           [tipIndex]: pipetteTips === 'full'
//         }), {})
//       }), {})
//   }
//
//   return {
//     labware,
//     instruments,
//     tipState
//   }
// }
