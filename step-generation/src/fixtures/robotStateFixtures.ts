import cloneDeep from 'lodash/cloneDeep'
import mapValues from 'lodash/mapValues'
import {
  getLabwareDefURI,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  fixtureP10Single as _fixtureP10Single,
  fixtureP10Multi as _fixtureP10Multi,
  fixtureP300Single as _fixtureP300Single,
  fixtureP300Multi as _fixtureP300Multi,
  fixtureP100096 as _fixtureP100096,
} from '@opentrons/shared-data/pipette/fixtures/name'
import _fixtureTrash from '@opentrons/shared-data/labware/fixtures/2/fixture_trash.json'
import _fixture96Plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import _fixture12Trough from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough.json'
import _fixtureTiprack10ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import _fixtureTiprack300ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import _fixtureTiprack1000ul from '@opentrons/shared-data/labware/fixtures/2/fixture_flex_96_tiprack_1000ul.json'
import _fixtureTiprackAdapter from '@opentrons/shared-data/labware/fixtures/2/fixture_flex_96_tiprack_adapter.json'
import {
  TEMPERATURE_APPROACHING_TARGET,
  TEMPERATURE_AT_TARGET,
  TEMPERATURE_DEACTIVATED,
  FIXED_TRASH_ID,
  OT_2_TRASH_DEF_URI,
} from '../constants'
import {
  DEFAULT_PIPETTE,
  MULTI_PIPETTE,
  PIPETTE_96,
  SOURCE_LABWARE,
  DEST_LABWARE,
  TROUGH_LABWARE,
} from './commandFixtures'
import { makeInitialRobotState } from '../utils'
import { tiprackWellNamesFlat } from './data'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { AdditionalEquipmentEntities } from '../types'
import type {
  Config,
  InvariantContext,
  ModuleEntities,
  PipetteEntities,
  RobotState,
  RobotStateAndWarnings,
} from '../'

const fixtureP10Single = _fixtureP10Single
const fixtureP10Multi = _fixtureP10Multi
const fixtureP300Single = _fixtureP300Single
const fixtureP300Multi = _fixtureP300Multi
const fixtureP100096 = _fixtureP100096

const fixtureTrash = _fixtureTrash as LabwareDefinition2
const fixture96Plate = _fixture96Plate as LabwareDefinition2
const fixture12Trough = _fixture12Trough as LabwareDefinition2
const fixtureTiprack10ul = _fixtureTiprack10ul as LabwareDefinition2
const fixtureTiprack300ul = _fixtureTiprack300ul as LabwareDefinition2
const fixtureTiprack1000ul = _fixtureTiprack1000ul as LabwareDefinition2
const fixtureTiprackAdapter = _fixtureTiprackAdapter as LabwareDefinition2

export const DEFAULT_CONFIG: Config = {
  OT_PD_DISABLE_MODULE_RESTRICTIONS: false,
}
// Eg {A1: true, B1: true, ...}
type WellTipState = Record<string, boolean>
export function getTiprackTipstate(
  filled: boolean | null | undefined
): WellTipState {
  return tiprackWellNamesFlat.reduce<WellTipState>(
    (acc, wellName: string) => ({ ...acc, [wellName]: Boolean(filled) }),
    {}
  )
}
// Eg A2 B2 C2 D2 E2 F2 G2 H2 keys
// NOTE: this assumes standard 96-tiprack
export function getTipColumn<T>(index: number, filled: T): Record<string, T> {
  return Array.from('ABCDEFGH')
    .map(wellLetter => `${wellLetter}${index}`)
    .reduce((acc, well) => ({ ...acc, [well]: filled }), {})
}

// standard context fixtures to use across tests
export function makeContext(): InvariantContext {
  const labwareEntities = {
    [FIXED_TRASH_ID]: {
      id: FIXED_TRASH_ID,

      labwareDefURI: OT_2_TRASH_DEF_URI,
      def: fixtureTrash,
    },
    [SOURCE_LABWARE]: {
      id: SOURCE_LABWARE,

      labwareDefURI: getLabwareDefURI(fixture96Plate),
      def: fixture96Plate,
    },
    [DEST_LABWARE]: {
      id: DEST_LABWARE,

      labwareDefURI: getLabwareDefURI(fixture96Plate),
      def: fixture96Plate,
    },
    [TROUGH_LABWARE]: {
      id: TROUGH_LABWARE,

      labwareDefURI: getLabwareDefURI(fixture12Trough),
      def: fixture12Trough,
    },
    tiprack1Id: {
      id: 'tiprack1Id',

      labwareDefURI: getLabwareDefURI(fixtureTiprack300ul),
      def: fixtureTiprack300ul,
    },
    tiprack2Id: {
      id: 'tiprack2Id',

      labwareDefURI: getLabwareDefURI(fixtureTiprack300ul),
      def: fixtureTiprack300ul,
    },
    tiprack3Id: {
      id: 'tiprack3Id',

      labwareDefURI: getLabwareDefURI(fixtureTiprack300ul),
      def: fixtureTiprack300ul,
    },
    tiprack4AdapterId: {
      id: 'tiprack4AdapterId',

      labwareDefURI: getLabwareDefURI(fixtureTiprackAdapter),
      def: fixtureTiprackAdapter,
    },
    tiprack5AdapterId: {
      id: 'tiprack5AdapterId',

      labwareDefURI: getLabwareDefURI(fixtureTiprackAdapter),
      def: fixtureTiprackAdapter,
    },
    tiprack4Id: {
      id: 'tiprack4Id',

      labwareDefURI: getLabwareDefURI(fixtureTiprack1000ul),
      def: fixtureTiprack1000ul,
    },
    tiprack5Id: {
      id: 'tiprack5Id',

      labwareDefURI: getLabwareDefURI(fixtureTiprack1000ul),
      def: fixtureTiprack1000ul,
    },
  }
  const moduleEntities: ModuleEntities = {}
  const additionalEquipmentEntities: AdditionalEquipmentEntities = {}
  const pipetteEntities: PipetteEntities = {
    p10SingleId: {
      name: 'p10_single',
      id: 'p10SingleId',

      tiprackDefURI: getLabwareDefURI(fixtureTiprack10ul),
      tiprackLabwareDef: fixtureTiprack10ul,
      spec: fixtureP10Single,
    },
    p10MultiId: {
      name: 'p10_multi',
      id: 'p10MultiId',

      tiprackDefURI: getLabwareDefURI(fixtureTiprack10ul),
      tiprackLabwareDef: fixtureTiprack10ul,
      spec: fixtureP10Multi,
    },
    [DEFAULT_PIPETTE]: {
      name: 'p300_single',
      id: DEFAULT_PIPETTE,

      tiprackDefURI: getLabwareDefURI(fixtureTiprack300ul),
      tiprackLabwareDef: fixtureTiprack300ul,
      spec: fixtureP300Single,
    },
    [MULTI_PIPETTE]: {
      name: 'p300_multi',
      id: MULTI_PIPETTE,

      tiprackDefURI: getLabwareDefURI(fixtureTiprack300ul),
      tiprackLabwareDef: fixtureTiprack300ul,
      spec: fixtureP300Multi,
    },
    [PIPETTE_96]: {
      name: 'p1000_96',
      id: PIPETTE_96,

      tiprackDefURI: getLabwareDefURI(fixtureTiprack1000ul),
      tiprackLabwareDef: fixtureTiprack1000ul,
      spec: fixtureP100096,
    },
  }
  return {
    labwareEntities,
    moduleEntities,
    pipetteEntities,
    additionalEquipmentEntities,
    config: DEFAULT_CONFIG,
  }
}
export const makeState = (args: {
  invariantContext: InvariantContext
  labwareLocations: RobotState['labware']
  moduleLocations?: RobotState['modules']
  pipetteLocations: RobotState['pipettes']
  tiprackSetting: Record<string, boolean>
}): RobotState => {
  const {
    invariantContext,
    labwareLocations,
    moduleLocations,
    pipetteLocations,
    tiprackSetting,
  } = args
  const robotState = makeInitialRobotState({
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
interface StandardMakeStateArgs {
  pipetteLocations: RobotState['pipettes']
  labwareLocations: RobotState['labware']
  moduleLocations: RobotState['modules']
}
export const makeStateArgsStandard = (): StandardMakeStateArgs => ({
  pipetteLocations: {
    [DEFAULT_PIPETTE]: {
      mount: 'left',
    },
    [MULTI_PIPETTE]: {
      mount: 'right',
    },
  },
  labwareLocations: {
    tiprack1Id: {
      slot: '1',
    },
    tiprack2Id: {
      slot: '5',
    },
    tiprack4AdapterId: {
      slot: '7',
    },
    tiprack5AdapterId: {
      slot: '8',
    },
    tiprack4Id: {
      slot: 'tiprack4AdapterId',
    },
    tiprack5Id: {
      slot: 'tiprack5AdapterId',
    },
    sourcePlateId: {
      slot: '2',
    },
    destPlateId: {
      slot: '3',
    },
    fixedTrash: {
      slot: '12',
    },
  },
  moduleLocations: {},
})
export const makeStateArgsLabwareOffDeck = (): StandardMakeStateArgs => ({
  pipetteLocations: {
    [DEFAULT_PIPETTE]: {
      mount: 'left',
    },
    [MULTI_PIPETTE]: {
      mount: 'right',
    },
  },
  labwareLocations: {
    tiprack1Id: {
      slot: 'B1',
    },
    tiprack2Id: {
      slot: 'A2',
    },
    sourcePlateId: {
      slot: 'offDeck',
    },
    destPlateId: {
      slot: 'C2',
    },
    fixedTrash: {
      slot: 'A3',
    },
  },
  moduleLocations: {},
})
export const getInitialRobotStateStandard = (
  invariantContext: InvariantContext
): RobotState => {
  const initialRobotState = makeState({
    ...makeStateArgsStandard(),
    invariantContext,
    tiprackSetting: {
      tiprack1Id: true,
      tiprack2Id: true,
    },
  })
  return initialRobotState
}
export const getInitialRobotStateWithOffDeckLabwareStandard = (
  invariantContext: InvariantContext
): RobotState => {
  const initialRobotState = makeState({
    ...makeStateArgsLabwareOffDeck(),
    invariantContext,
    tiprackSetting: {
      tiprack1Id: true,
      tiprack2Id: true,
    },
  })
  return initialRobotState
}
export const getRobotStateAndWarningsStandard = (
  invariantContext: InvariantContext
): RobotStateAndWarnings => {
  const initialRobotState = getInitialRobotStateStandard(invariantContext)
  return {
    robotState: initialRobotState,
    warnings: [],
  }
}
export const getRobotStateWithTipStandard = (
  invariantContext: InvariantContext
): RobotState => {
  const robotStateWithTip = makeState({
    ...makeStateArgsStandard(),
    invariantContext,
    tiprackSetting: {
      tiprack1Id: true,
      tiprack2Id: true,
    },
  })
  robotStateWithTip.tipState.pipettes[DEFAULT_PIPETTE] = true
  return robotStateWithTip
}
export const getRobotStatePickedUpTipStandard = (
  invariantContext: InvariantContext
): RobotState => {
  const robotStatePickedUpOneTip = makeState({
    ...makeStateArgsStandard(),
    invariantContext,
    tiprackSetting: {
      tiprack1Id: true,
    },
  })
  robotStatePickedUpOneTip.tipState.pipettes[DEFAULT_PIPETTE] = true
  robotStatePickedUpOneTip.tipState.tipracks.tiprack1Id.A1 = false
  return robotStatePickedUpOneTip
}
export const getRobotInitialStateNoTipsRemain = (
  invariantContext: InvariantContext
): RobotState => {
  const robotInitialStateNoTipsRemain = makeState({
    ...makeStateArgsStandard(),
    invariantContext,
    tiprackSetting: {
      tiprack1Id: false,
      tiprack2Id: false,
    },
  })
  return robotInitialStateNoTipsRemain
}
interface StateAndContext {
  robotState: RobotState
  invariantContext: InvariantContext
}
export const getStateAndContextTempTCModules = ({
  temperatureModuleId,
  thermocyclerId,
}: {
  temperatureModuleId: string
  thermocyclerId: string
}): StateAndContext => {
  const invariantContext = makeContext()
  // @ts-expect-error(SA, 2021-05-03): 'foo' is not a legit module model
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
    tiprackSetting: {
      tiprack1Id: true,
    },
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
      slot: 'span7_8_10_11',
      moduleState: {
        type: THERMOCYCLER_MODULE_TYPE,
        blockTargetTemp: null,
        lidTargetTemp: null,
        lidOpen: null,
      },
    },
  }
  return {
    invariantContext,
    robotState,
  }
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
