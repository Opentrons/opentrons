// @flow
import mapValues from 'lodash/mapValues'
import { getLabwareDefURI } from '@opentrons/shared-data'
import {
  fixtureP10Single,
  fixtureP10Multi,
  fixtureP300Single,
  fixtureP300Multi,
} from '@opentrons/shared-data/pipette/fixtures/name'
import fixtureTrash from '@opentrons/shared-data/labware/fixtures/2/fixtureTrash.json'
import fixture96Plate from '@opentrons/shared-data/labware/fixtures/2/fixture96Plate.json'
import fixture12Trough from '@opentrons/shared-data/labware/fixtures/2/fixture12Trough.json'
import fixtureTipRack10Ul from '@opentrons/shared-data/labware/fixtures/2/fixtureTipRack10Ul.json'
import fixtureTipRack300Ul from '@opentrons/shared-data/labware/fixtures/2/fixtureTipRack300Ul.json'

import {
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
  DEST_LABWARE,
  FIXED_TRASH_ID,
} from './commandFixtures'
import { makeInitialRobotState } from '../../utils'
import { tiprackWellNamesFlat } from './data'
import type { InvariantContext, RobotState } from '../../'
import type {
  CommandsAndRobotState,
  CommandCreatorErrorResponse,
} from '../../types'

/** Used to wrap command creators in tests, effectively casting their results
 **  to normal response or error response
 **/
export function getSuccessResult(
  result: CommandsAndRobotState | CommandCreatorErrorResponse
): CommandsAndRobotState {
  if (result.errors) {
    throw new Error(
      `Expected a successful command creator call but got errors: ${JSON.stringify(
        result.errors
      )}`
    )
  }
  return result
}

export function getErrorResult(
  result: CommandsAndRobotState | CommandCreatorErrorResponse
): CommandCreatorErrorResponse {
  if (!result.errors) {
    throw new Error(
      `Expected command creator to return errors but got success result`
    )
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
// NOTE: this assumes standard 96-tiprack
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

// standard context fixtures to use across tests
export function makeContext(): InvariantContext {
  const labwareEntities = {
    trashId: {
      id: FIXED_TRASH_ID,
      labwareDefURI: getLabwareDefURI(fixtureTrash),
      def: fixtureTrash,
    },
    sourcePlateId: {
      id: SOURCE_LABWARE,
      labwareDefURI: getLabwareDefURI(fixture96Plate),
      def: fixture96Plate,
    },
    destPlateId: {
      id: DEST_LABWARE,
      labwareDefURI: getLabwareDefURI(fixture96Plate),
      def: fixture96Plate,
    },
    troughId: {
      id: 'troughId',
      labwareDefURI: getLabwareDefURI(fixture12Trough),
      def: fixture12Trough,
    },
    tiprack1Id: {
      id: 'tiprack1Id',
      labwareDefURI: getLabwareDefURI(fixtureTipRack300Ul),
      def: fixtureTipRack300Ul,
    },
    tiprack2Id: {
      id: 'tiprack2Id',
      labwareDefURI: getLabwareDefURI(fixtureTipRack300Ul),
      def: fixtureTipRack300Ul,
    },
    tiprack3Id: {
      id: 'tiprack3Id',
      labwareDefURI: getLabwareDefURI(fixtureTipRack300Ul),
      def: fixtureTipRack300Ul,
    },
  }

  const pipetteEntities = {
    p10SingleId: {
      name: 'p10_single',
      id: 'p10SingleId',
      tiprackDefURI: getLabwareDefURI(fixtureTipRack10Ul),
      tiprackLabwareDef: fixtureTipRack10Ul,
      spec: fixtureP10Single,
    },
    p10MultiId: {
      name: 'p10_multi',
      id: 'p10MultiId',
      tiprackDefURI: getLabwareDefURI(fixtureTipRack10Ul),
      tiprackLabwareDef: fixtureTipRack10Ul,
      spec: fixtureP10Multi,
    },
    p300SingleId: {
      name: 'p300_single',
      id: DEFAULT_PIPETTE,
      tiprackDefURI: getLabwareDefURI(fixtureTipRack300Ul),
      tiprackLabwareDef: fixtureTipRack300Ul,
      spec: fixtureP300Single,
    },
    p300MultiId: {
      name: 'p300_multi',
      id: 'p300MultiId',
      tiprackDefURI: getLabwareDefURI(fixtureTipRack300Ul),
      tiprackLabwareDef: fixtureTipRack300Ul,
      spec: fixtureP300Multi,
    },
  }
  return { labwareEntities, pipetteEntities }
}

export const makeState = (args: {|
  invariantContext: InvariantContext,
  labwareLocations: $PropertyType<RobotState, 'labware'>,
  pipetteLocations: $PropertyType<RobotState, 'pipettes'>,
  tiprackSetting: { [labwareId: string]: boolean },
|}) => {
  const {
    invariantContext,
    labwareLocations,
    pipetteLocations,
    tiprackSetting,
  } = args
  let robotState = makeInitialRobotState({
    invariantContext,
    labwareLocations,
    pipetteLocations,
  })
  // overwrite tiprack tip state using tiprackSetting arg
  robotState.tipState.tipracks = mapValues(tiprackSetting, setting =>
    getTiprackTipstate(setting)
  )
  return robotState
}

// ===== "STANDARDS" for uniformity across tests =====
export const makeStateArgsStandard = () => ({
  pipetteLocations: {
    p300SingleId: { mount: 'left' },
    p300MultiId: { mount: 'right' },
  },
  labwareLocations: {
    tiprack1Id: { slot: '1' },
    tiprack2Id: { slot: '5' },
    sourcePlateId: { slot: '2' },
    destPlateId: { slot: '3' },
    trashId: { slot: '12' },
  },
})
export const getInitialRobotStateStandard = (
  invariantContext: InvariantContext
) => {
  const initialRobotState = makeState({
    ...makeStateArgsStandard(),
    invariantContext,
    tiprackSetting: { tiprack1Id: true, tiprack2Id: true },
  })
  return initialRobotState
}

export const getRobotStateWithTipStandard = (
  invariantContext: InvariantContext
) => {
  const robotStateWithTip = makeState({
    ...makeStateArgsStandard(),
    invariantContext,
    tiprackSetting: { tiprack1Id: true, tiprack2Id: true },
  })
  robotStateWithTip.tipState.pipettes.p300SingleId = true
  return robotStateWithTip
}

export const getRobotStatePickedUpTipStandard = (
  invariantContext: InvariantContext
) => {
  const robotStatePickedUpOneTip = makeState({
    ...makeStateArgsStandard(),
    invariantContext,
    tiprackSetting: { tiprack1Id: true },
  })
  robotStatePickedUpOneTip.tipState.pipettes.p300SingleId = true
  robotStatePickedUpOneTip.tipState.tipracks.tiprack1Id.A1 = false
  return robotStatePickedUpOneTip
}

export const getRobotInitialStateNoTipsRemain = (
  invariantContext: InvariantContext
) => {
  const robotInitialStateNoTipsRemain = makeState({
    ...makeStateArgsStandard(),
    invariantContext,
    tiprackSetting: { tiprack1Id: false, tiprack2Id: false },
  })
  return robotInitialStateNoTipsRemain
}
