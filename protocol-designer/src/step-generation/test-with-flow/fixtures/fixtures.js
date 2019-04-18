// @flow
// TODO IMMEDIATELY audit this file and use of fixtures, now that robotState is simpler and invariantContext is split out
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import range from 'lodash/range'
import reduce from 'lodash/reduce'
import { reduceCommandCreators } from '../../utils'
import { tiprackWellNamesFlat } from './data'
import type {
  TemporalPipette,
  PipetteEntity,
  LabwareEntity,
} from '../../../step-forms' // TODO IMMEDIATELY move temporal types somewhere more universal
import type { InvariantContext, RobotState } from '../../'
import type {
  CommandsAndRobotState,
  CommandCreatorErrorResponse,
} from '../../types'

/** Used to wrap command creators in tests, effectively casting their results
 **  to normal response or error response
 **/
export const commandCreatorNoErrors = (command: any) => (commandArgs: *) => (
  invariantContext: InvariantContext,
  robotState: RobotState
): CommandsAndRobotState => {
  const result = command(commandArgs)(invariantContext, robotState)
  if (result.errors) {
    throw new Error('expected no errors, got ' + JSON.stringify(result.errors))
  }
  return result
}

export const commandCreatorHasErrors = (command: *) => (commandArgs: *) => (
  invariantContext: InvariantContext,
  robotState: RobotState
): CommandCreatorErrorResponse => {
  const result = command(commandArgs)(invariantContext, robotState)
  if (!result.errors) {
    throw new Error('expected errors')
  }
  return result
}

export const compoundCommandCreatorNoErrors = (command: *) => (
  commandArgs: *
) => (
  invariantContext: InvariantContext,
  robotState: RobotState
): CommandsAndRobotState => {
  const result = reduceCommandCreators(
    command(commandArgs)(invariantContext, robotState)
  )(invariantContext, robotState)
  if (result.errors) {
    throw new Error('expected no errors, got ' + JSON.stringify(result.errors))
  }
  return result
}

export const compoundCommandCreatorHasErrors = (command: *) => (
  commandArgs: *
) => (
  invariantContext: InvariantContext,
  robotState: RobotState
): CommandCreatorErrorResponse => {
  const result = reduceCommandCreators(
    command(commandArgs)(invariantContext, robotState)
  )(invariantContext, robotState)
  if (!result.errors) {
    throw new Error('expected errors')
  }
  return result
}

// Eg {A1: true, B1: true, ...}
type WellTipState = { [wellName: string]: boolean }
export function getTiprackTipstate(filled: ?boolean): WellTipState {
  return tiprackWellNamesFlat.reduce(
    (acc, wellName) => ({ ...acc, [wellName]: Boolean(filled) }),
    {}
  )
}

// Eg A2 B2 C2 D2 E2 F2 G2 H2 keys
export function getTipColumn<T>(
  index: number,
  filled: T
): { [well: string]: T } {
  return Array.from('ABCDEFGH')
    .map(wellLetter => `${wellLetter}${index}`)
    .reduce(
      (acc, well) => ({
        ...acc,
        [well]: filled,
      }),
      {}
    )
}

export const all8ChTipIds = range(8)

export function createTipLiquidState<T>(
  channels: number,
  contents: T
): { [tipId: string]: T } {
  return range(channels).reduce(
    (tipIdAcc, tipId) => ({
      ...tipIdAcc,
      [tipId]: contents,
    }),
    {}
  )
}

// TODO Ian 2018-03-14: these pipette fixtures should use file-data/pipetteData.js,
// which should in turn be lifted out to a general pipette data project? // TODO IMMEDIATELY revisit this comment
export const p300Single: TemporalPipette = {
  // TODO IMMEDIATELY rename
  mount: 'right',
}

export const p300Multi: TemporalPipette = {
  // TODO IMMEDIATELY rename
  mount: 'left',
}

export function createEmptyLiquidState(invariantContext: InvariantContext) {
  const { labwareEntities, pipetteEntities } = invariantContext

  return {
    pipettes: reduce(
      pipetteEntities,
      (acc, pipette: PipetteEntity, id: string) => {
        const pipetteSpec = pipette.spec
        return {
          ...acc,
          [id]: createTipLiquidState(pipetteSpec.channels, {}),
        }
      },
      {}
    ),
    labware: reduce(
      labwareEntities,
      (acc, labware: LabwareEntity, id: string) => {
        return { ...acc, [id]: mapValues(labware.def.wells, () => ({})) }
      },
      {}
    ),
  }
}

type SubtractLiquidState = { liquidState: * }
type RobotStateNoLiquidState = $Diff<RobotState, SubtractLiquidState>

type CreateRobotArgs = {
  sourcePlateType: string,
  destPlateType?: string,
  tipracks: Array<10 | 200 | 300 | 1000>,
  fillPipetteTips: boolean,
  fillTiprackTips?: boolean,
}

function getTiprackType(volume: number): string {
  const tiprackMap = {
    '1000': 'tiprack-1000ul',
    '300': 'opentrons-tiprack-300ul',
    '200': 'tiprack-200ul',
    '10': 'tiprack-10ul',
  }
  const result = tiprackMap[volume]
  if (!result) {
    throw new Error(
      `No tiprack in getTiprackType for tiprack volume: ${volume}`
    )
  }
  return result
}

/** RobotState without liquidState key, for use with jest's `toMatchObject` */
export function createRobotStateFixture(
  args: CreateRobotArgs
): RobotStateNoLiquidState {
  function _getTiprackSlot(
    tiprackIndex: number,
    occupiedSlots: Array<string>
  ): string {
    const slot = (tiprackIndex + 1).toString()
    if (occupiedSlots.includes(slot)) {
      throw new Error(
        `Cannot create tiprack at slot ${slot}, slot is occupied by other labware`
      )
    }
    return slot.toString()
  }

  const pipettes = {
    p300SingleId: p300Single,
    p300MultiId: p300Multi,
  }

  const destLabware = args.destPlateType
    ? {
        destPlateId: {
          slot: '11',
        },
      }
    : {}

  const baseLabware = {
    // TODO IMMEDIATELY revisit
    ...destLabware,
    sourcePlateId: {
      slot: '10',
    },
    trashId: {
      slot: '12',
    },
  }

  const occupiedSlots = map(
    baseLabware,
    (labwareData: $Values<typeof baseLabware>, labwareId) => labwareData.slot
  )

  const tiprackLabware = args.tipracks.reduce(
    (acc, tiprackVolume, tiprackIndex) => {
      return {
        ...acc,
        [`tiprack${tiprackIndex + 1}Id`]: {
          slot: _getTiprackSlot(tiprackIndex, occupiedSlots),
          type: getTiprackType(tiprackVolume),
          name: `Tip rack ${tiprackIndex + 1}`,
        },
      }
    },
    {}
  )

  return {
    pipettes,

    labware: {
      ...baseLabware,
      ...tiprackLabware,
    },

    tipState: {
      tipracks: Object.keys(tiprackLabware).reduce(
        (acc, tiprackId) => ({
          ...acc,
          [tiprackId]: getTiprackTipstate(args.fillTiprackTips),
        }),
        {}
      ),
      pipettes: {
        p300SingleId: args.fillPipetteTips,
        p300MultiId: args.fillPipetteTips,
      },
    },
  }
}

// standard context fixtures to use across tests
export function makeContext(): InvariantContext {
  // TODO IMMEDIATELY use fixture defs not real defs
  const fixture12Trough = require('@opentrons/shared-data/definitions2/usa_scientific_12_trough_22_ml.json')
  const fixture96Plate = require('@opentrons/shared-data/definitions2/generic_96_wellplate_380_ul.json')
  const fixtureTipRack10ul = require('@opentrons/shared-data/definitions2/opentrons_96_tiprack_10_ul.json')
  const fixtureTipRack300ul = require('@opentrons/shared-data/definitions2/opentrons_96_tiprack_300_ul.json')
  const fixtureTrash = require('@opentrons/shared-data/definitions2/opentrons_1_trash_1.1_l.json')

  // TODO IMMEDIATELY fixtures for pipette specs too
  const fixtureP10Single = require('@opentrons/shared-data/robot-data/pipetteNameSpecs.json')[
    'p10_single'
  ]
  const fixtureP10Multi = require('@opentrons/shared-data/robot-data/pipetteNameSpecs.json')[
    'p10_multi'
  ]
  const fixtureP300Single = require('@opentrons/shared-data/robot-data/pipetteNameSpecs.json')[
    'p300_single'
  ]
  const fixtureP300Multi = require('@opentrons/shared-data/robot-data/pipetteNameSpecs.json')[
    'p300_multi'
  ]

  const labwareEntities = {
    trashId: {
      id: 'trashId',
      type: 'fixtureTrash',
      def: fixtureTrash,
    },
    sourcePlateId: {
      id: 'sourcePlateId',
      type: 'fixture96Plate',
      def: fixture96Plate,
    },
    destPlateId: {
      id: 'destPlateId',
      type: 'fixture96Plate',
      def: fixture96Plate,
    },
    troughId: {
      id: 'troughId',
      type: 'fixture12Trough',
      def: fixture12Trough,
    },
    // TODO IMMEDIATELY rename tipRack300_1Id etc
    tiprack1Id: {
      id: 'tiprack1Id',
      type: 'fixtureTipRack300ul',
      def: fixtureTipRack300ul,
    },
    tiprack2Id: {
      id: 'tiprack2Id',
      type: 'fixtureTipRack300ul',
      def: fixtureTipRack300ul,
    },
    tiprack3Id: {
      id: 'tiprack3Id',
      type: 'fixtureTipRack300ul',
      def: fixtureTipRack300ul,
    },
  }

  const pipetteEntities = {
    p10SingleId: {
      name: 'p10_single',
      id: 'p10SingleId',
      tiprackModel: 'fixtureTipRack10ul',
      tiprackLabwareDef: fixtureTipRack10ul,
      spec: fixtureP10Single,
    },
    p10MultiId: {
      name: 'p10_multi',
      id: 'p10MultiId',
      tiprackModel: 'fixtureTipRack10ul',
      tiprackLabwareDef: fixtureTipRack10ul,
      spec: fixtureP10Multi,
    },
    p300SingleId: {
      name: 'p300_single',
      id: 'p300SingleId',
      tiprackModel: 'fixtureTipRack300ul',
      tiprackLabwareDef: fixtureTipRack300ul,
      spec: fixtureP300Single,
    },
    p300MultiId: {
      name: 'p300_multi',
      id: 'p300MultiId',
      tiprackModel: 'fixtureTipRack300ul',
      tiprackLabwareDef: fixtureTipRack300ul,
      spec: fixtureP300Multi,
    },
  }
  return { labwareEntities, pipetteEntities }
}

type MakeStateArgs = {|
  invariantContext: InvariantContext,
  labwareLocations: $PropertyType<RobotState, 'labware'>,
  pipetteLocations: $PropertyType<RobotState, 'pipettes'>,
  tiprackSetting: { [labwareId: string]: boolean },
|}
export function makeState(args: MakeStateArgs): RobotState {
  const {
    invariantContext,
    labwareLocations,
    pipetteLocations,
    tiprackSetting,
  } = args
  // NOTE: pipettes have no tips by default
  return {
    labware: labwareLocations,
    pipettes: pipetteLocations,
    liquidState: createEmptyLiquidState(invariantContext),
    tipState: {
      pipettes: reduce(
        pipetteLocations,
        (acc, temporalPipette, id) =>
          temporalPipette.mount ? { ...acc, [id]: false } : acc,
        {}
      ),
      tipracks: mapValues(tiprackSetting, setting =>
        getTiprackTipstate(setting)
      ),
    },
  }
}
