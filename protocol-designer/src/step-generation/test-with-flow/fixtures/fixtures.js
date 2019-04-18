// @flow
// TODO IMMEDIATELY audit this file and use of fixtures, now that robotState is simpler and invariantContext is split out
import mapValues from 'lodash/mapValues'
import range from 'lodash/range'
import reduce from 'lodash/reduce'
import {
  fixtureTrash,
  fixture96Plate,
  fixture12Trough,
  fixtureTipRack10Ul,
  fixtureTipRack300Ul,
  fixtureP10Single,
  fixtureP10Multi,
  fixtureP300Single,
  fixtureP300Multi,
} from '@opentrons/shared-data/fixtures'
import { reduceCommandCreators } from '../../utils'
import { tiprackWellNamesFlat } from './data'
// TODO IMMEDIATELY move temporal types somewhere more universal
import type { PipetteEntity, LabwareEntity } from '../../../step-forms'
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

// standard context fixtures to use across tests
export function makeContext(): InvariantContext {
  const labwareEntities = {
    trashId: {
      id: 'trashId',
      type: fixtureTrash.otId,
      def: fixtureTrash,
    },
    sourcePlateId: {
      id: 'sourcePlateId',
      type: fixture96Plate.otId,
      def: fixture96Plate,
    },
    destPlateId: {
      id: 'destPlateId',
      type: fixture96Plate.otId,
      def: fixture96Plate,
    },
    troughId: {
      id: 'troughId',
      type: fixture12Trough.otId,
      def: fixture12Trough,
    },
    // TODO IMMEDIATELY rename tipRack300_1Id etc
    tiprack1Id: {
      id: 'tiprack1Id',
      type: fixtureTipRack300Ul.otId,
      def: fixtureTipRack300Ul,
    },
    tiprack2Id: {
      id: 'tiprack2Id',
      type: fixtureTipRack300Ul.otId,
      def: fixtureTipRack300Ul,
    },
    tiprack3Id: {
      id: 'tiprack3Id',
      type: fixtureTipRack300Ul.otId,
      def: fixtureTipRack300Ul,
    },
  }

  const pipetteEntities = {
    p10SingleId: {
      name: 'p10_single',
      id: 'p10SingleId',
      tiprackModel: fixtureTipRack10Ul.otId,
      tiprackLabwareDef: fixtureTipRack10Ul,
      spec: fixtureP10Single,
    },
    p10MultiId: {
      name: 'p10_multi',
      id: 'p10MultiId',
      tiprackModel: fixtureTipRack10Ul.otId,
      tiprackLabwareDef: fixtureTipRack10Ul,
      spec: fixtureP10Multi,
    },
    p300SingleId: {
      name: 'p300_single',
      id: 'p300SingleId',
      tiprackModel: fixtureTipRack300Ul.otId,
      tiprackLabwareDef: fixtureTipRack300Ul,
      spec: fixtureP300Single,
    },
    p300MultiId: {
      name: 'p300_multi',
      id: 'p300MultiId',
      tiprackModel: fixtureTipRack300Ul.otId,
      tiprackLabwareDef: fixtureTipRack300Ul,
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
