// @flow
import cloneDeep from 'lodash/cloneDeep'
import mapValues from 'lodash/mapValues'
import {
  getLabwareDefURI,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  fixtureP10Single,
  fixtureP10Multi,
  fixtureP300Single,
  fixtureP300Multi,
} from '@opentrons/shared-data/pipette/fixtures/name'
import fixture_trash from '@opentrons/shared-data/labware/fixtures/2/fixture_trash.json'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import fixture_12_trough from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough.json'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'

import {
  SPAN7_8_10_11_SLOT,
  TEMPERATURE_APPROACHING_TARGET,
  TEMPERATURE_AT_TARGET,
  TEMPERATURE_DEACTIVATED,
} from '../../constants'
import {
  DEFAULT_PIPETTE,
  MULTI_PIPETTE,
  SOURCE_LABWARE,
  DEST_LABWARE,
  TROUGH_LABWARE,
  FIXED_TRASH_ID,
} from './commandFixtures'
import { makeInitialRobotState } from '../utils'
import { tiprackWellNamesFlat } from './data'
import type { InvariantContext, RobotState } from '../'

// Eg {A1: true, B1: true, ...}
type WellTipState = { [wellName: string]: boolean }
export function getTiprackTipstate(filled: ?boolean): WellTipState {
  return tiprackWellNamesFlat.reduce<WellTipState>(
    (acc, wellName: string) => ({
      ...acc,
      [wellName]: Boolean(filled),
    }),
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
    [FIXED_TRASH_ID]: {
      id: FIXED_TRASH_ID,
      labwareDefURI: getLabwareDefURI(fixture_trash),
      def: fixture_trash,
    },
    [SOURCE_LABWARE]: {
      id: SOURCE_LABWARE,
      labwareDefURI: getLabwareDefURI(fixture_96_plate),
      def: fixture_96_plate,
    },
    [DEST_LABWARE]: {
      id: DEST_LABWARE,
      labwareDefURI: getLabwareDefURI(fixture_96_plate),
      def: fixture_96_plate,
    },
    [TROUGH_LABWARE]: {
      id: TROUGH_LABWARE,
      labwareDefURI: getLabwareDefURI(fixture_12_trough),
      def: fixture_12_trough,
    },
    tiprack1Id: {
      id: 'tiprack1Id',
      labwareDefURI: getLabwareDefURI(fixture_tiprack_300_ul),
      def: fixture_tiprack_300_ul,
    },
    tiprack2Id: {
      id: 'tiprack2Id',
      labwareDefURI: getLabwareDefURI(fixture_tiprack_300_ul),
      def: fixture_tiprack_300_ul,
    },
    tiprack3Id: {
      id: 'tiprack3Id',
      labwareDefURI: getLabwareDefURI(fixture_tiprack_300_ul),
      def: fixture_tiprack_300_ul,
    },
  }

  const moduleEntities = {}

  const pipetteEntities = {
    p10SingleId: {
      name: 'p10_single',
      id: 'p10SingleId',
      tiprackDefURI: getLabwareDefURI(fixture_tiprack_10_ul),
      tiprackLabwareDef: fixture_tiprack_10_ul,
      spec: fixtureP10Single,
    },
    p10MultiId: {
      name: 'p10_multi',
      id: 'p10MultiId',
      tiprackDefURI: getLabwareDefURI(fixture_tiprack_10_ul),
      tiprackLabwareDef: fixture_tiprack_10_ul,
      spec: fixtureP10Multi,
    },
    [DEFAULT_PIPETTE]: {
      name: 'p300_single',
      id: DEFAULT_PIPETTE,
      tiprackDefURI: getLabwareDefURI(fixture_tiprack_300_ul),
      tiprackLabwareDef: fixture_tiprack_300_ul,
      spec: fixtureP300Single,
    },
    [MULTI_PIPETTE]: {
      name: 'p300_multi',
      id: MULTI_PIPETTE,
      tiprackDefURI: getLabwareDefURI(fixture_tiprack_300_ul),
      tiprackLabwareDef: fixture_tiprack_300_ul,
      spec: fixtureP300Multi,
    },
  }
  return { labwareEntities, moduleEntities, pipetteEntities }
}

export const makeState = (args: {|
  invariantContext: InvariantContext,
  labwareLocations: $PropertyType<RobotState, 'labware'>,
  moduleLocations?: $PropertyType<RobotState, 'modules'>,
  pipetteLocations: $PropertyType<RobotState, 'pipettes'>,
  tiprackSetting: { [labwareId: string]: boolean },
|}) => {
  const {
    invariantContext,
    labwareLocations,
    moduleLocations,
    pipetteLocations,
    tiprackSetting,
  } = args
  let robotState = makeInitialRobotState({
    invariantContext,
    labwareLocations,
    moduleLocations: moduleLocations || {},
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
    [DEFAULT_PIPETTE]: { mount: 'left' },
    [MULTI_PIPETTE]: { mount: 'right' },
  },
  labwareLocations: {
    tiprack1Id: { slot: '1' },
    tiprack2Id: { slot: '5' },
    sourcePlateId: { slot: '2' },
    destPlateId: { slot: '3' },
    trashId: { slot: '12' },
  },
  moduleLocations: {},
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

export const getRobotStateAndWarningsStandard = (
  invariantContext: InvariantContext
) => {
  const initialRobotState = getInitialRobotStateStandard(invariantContext)

  return {
    robotState: initialRobotState,
    warnings: [],
  }
}

export const getRobotStateWithTipStandard = (
  invariantContext: InvariantContext
) => {
  const robotStateWithTip = makeState({
    ...makeStateArgsStandard(),
    invariantContext,
    tiprackSetting: { tiprack1Id: true, tiprack2Id: true },
  })
  robotStateWithTip.tipState.pipettes[DEFAULT_PIPETTE] = true
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
  robotStatePickedUpOneTip.tipState.pipettes[DEFAULT_PIPETTE] = true
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

export const getStateAndContextTempTCModules = ({
  temperatureModuleId,
  thermocyclerId,
}: {
  temperatureModuleId: string,
  thermocyclerId: string,
}) => {
  const invariantContext = makeContext()
  invariantContext.moduleEntities = {
    [temperatureModuleId]: {
      id: temperatureModuleId,
      type: TEMPERATURE_MODULE_TYPE,
      model: 'foo',
    },
    [thermocyclerId]: {
      id: thermocyclerId,
      type: THERMOCYCLER_MODULE_TYPE,
      model: 'foo',
    },
  }

  const robotState = makeState({
    ...makeStateArgsStandard(),
    invariantContext,
    tiprackSetting: { tiprack1Id: true },
  })

  robotState.modules = {
    [temperatureModuleId]: {
      slot: '3',
      moduleState: {
        type: TEMPERATURE_MODULE_TYPE,
        status: TEMPERATURE_DEACTIVATED,
        targetTemperature: null,
      },
    },
    [thermocyclerId]: {
      slot: SPAN7_8_10_11_SLOT,
      moduleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: null,
      },
    },
  }
  return { invariantContext, robotState }
}

export const robotWithStatusAndTemp = (
  robotState: RobotState,
  temperatureModuleId: string,
  status:
    | typeof TEMPERATURE_AT_TARGET
    | typeof TEMPERATURE_APPROACHING_TARGET
    | typeof TEMPERATURE_DEACTIVATED,
  targetTemperature: number | null
): RobotState => {
  const robot = cloneDeep(robotState)
  robot.modules[temperatureModuleId].moduleState = {
    type: TEMPERATURE_MODULE_TYPE,
    targetTemperature,
    status,
  }
  return robot
}
