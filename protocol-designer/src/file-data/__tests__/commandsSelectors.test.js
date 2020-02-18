import fixture_12_trough from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough.json'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import fixture_trash from '@opentrons/shared-data/labware/fixtures/2/fixture_trash.json'
import {
  getInitialRobotStateStandard,
  makeContext,
  DEFAULT_PIPETTE,
  MULTI_PIPETTE,
  SOURCE_LABWARE,
  DEST_LABWARE,
} from '../../step-generation/__fixtures__'

import { getLabwareLiquidState, getRobotStateTimeline } from '../selectors'
jest.mock('../../labware-defs/utils')

let labwareEntities
let ingredLocs

beforeEach(() => {
  labwareEntities = {
    FIXED_TRASH_ID: {
      def: fixture_trash,
    },
    wellPlateId: {
      def: fixture_96_plate,
    },
    troughId: {
      def: fixture_12_trough,
    },
  }

  ingredLocs = {
    wellPlateId: {
      A1: { '0': { volume: 100 } },
      B1: { '0': { volume: 150 } },
    },
    troughId: {
      A1: { '0': { volume: 105 } },
      A2: { '0': { volume: 155 } },
      A3: { '1': { volume: 115 } },
      A6: { '1': { volume: 111 } },
    },
  }
})

function hasAllWellKeys(result) {
  // make sure each labware has keys for all wells added in
  expect(Object.keys(result.wellPlateId).length).toBe(96)
  expect(Object.keys(result.troughId).length).toBe(12)
  expect(Object.keys(result.FIXED_TRASH_ID).length).toBe(1)
}

describe('getLabwareLiquidState', () => {
  test('no labware + no ingreds', () => {
    expect(getLabwareLiquidState.resultFunc({}, {})).toEqual({})
  })

  test('labware + no ingreds: generate empty well keys', () => {
    const result = getLabwareLiquidState.resultFunc({}, labwareEntities)

    hasAllWellKeys(result)
  })

  test('selects liquids with multiple ingredient groups & multiple labware: generate all well keys', () => {
    const result = getLabwareLiquidState.resultFunc(ingredLocs, labwareEntities)

    expect(result).toMatchObject(ingredLocs)

    hasAllWellKeys(result)
  })
})

describe('getRobotStateTimeline', () => {
  test('performs eager tip dropping', () => {
    const allStepArgsAndErrors = {
      a: {
        stepArgs: {
          pipette: DEFAULT_PIPETTE,
          volume: 5,
          sourceLabware: SOURCE_LABWARE,
          destLabware: DEST_LABWARE,
          aspirateFlowRateUlSec: 3.78,
          dispenseFlowRateUlSec: 3.78,
          aspirateOffsetFromBottomMm: 1,
          dispenseOffsetFromBottomMm: 0.5,
          blowoutFlowRateUlSec: 3.78,
          blowoutOffsetFromTopMm: 0,
          changeTip: 'once',
          preWetTip: false,
          mixInDestination: null,
          touchTipAfterAspirate: false,
          touchTipAfterAspirateOffsetMmFromBottom: 13.81,
          touchTipAfterDispense: false,
          touchTipAfterDispenseOffsetMmFromBottom: 13.81,
          name: 'transfer',
          commandCreatorFnName: 'transfer',
          blowoutLocation: null,
          sourceWells: ['A1', 'A2'],
          destWells: ['A12', 'A12'],
          mixBeforeAspirate: null,
        },
      },
      b: {
        stepArgs: {
          pipette: MULTI_PIPETTE,
          volume: 5,
          sourceLabware: SOURCE_LABWARE,
          destLabware: DEST_LABWARE,
          aspirateFlowRateUlSec: 3.78,
          dispenseFlowRateUlSec: 3.78,
          aspirateOffsetFromBottomMm: 1,
          dispenseOffsetFromBottomMm: 0.5,
          blowoutFlowRateUlSec: 3.78,
          blowoutOffsetFromTopMm: 0,
          changeTip: 'always',
          preWetTip: false,
          mixInDestination: null,
          touchTipAfterAspirate: false,
          touchTipAfterAspirateOffsetMmFromBottom: 13.81,
          touchTipAfterDispense: false,
          touchTipAfterDispenseOffsetMmFromBottom: 13.81,
          name: 'transfer',
          commandCreatorFnName: 'transfer',
          blowoutLocation: null,
          sourceWells: ['A1'],
          destWells: ['A12'],
          mixBeforeAspirate: null,
        },
      },
      c: {
        stepArgs: {
          commandCreatorFnName: 'mix',
          name: 'Mix',
          description: 'description would be here 2018-03-01',
          labware: SOURCE_LABWARE,
          wells: ['A2', 'A3'],
          volume: 5,
          times: 2,
          touchTip: false,
          touchTipMmFromBottom: 13.81,
          changeTip: 'always',
          blowoutLocation: null,
          pipette: DEFAULT_PIPETTE,
          aspirateFlowRateUlSec: 3.78,
          dispenseFlowRateUlSec: 3.78,
          blowoutFlowRateUlSec: 3.78,
          aspirateOffsetFromBottomMm: 0.5,
          dispenseOffsetFromBottomMm: 0.5,
          blowoutOffsetFromTopMm: 0,
        },
      },
    }
    const orderedStepIds = ['a', 'b', 'c']
    const invariantContext = makeContext()
    const initialRobotState = getInitialRobotStateStandard(invariantContext)
    const featureFlagMemoizationBust = { foo: true }

    const result = getRobotStateTimeline.resultFunc(
      allStepArgsAndErrors,
      orderedStepIds,
      initialRobotState,
      invariantContext,
      featureFlagMemoizationBust
    )

    expect(result.timeline.length).toEqual(orderedStepIds.length)
    expect(result.errors).toBe(null)

    const commandOverview = result.timeline.map(frame =>
      frame.commands.map(command => command.command)
    )
    // NOTE: if you update this snapshot, make sure this it exhibits eager tip dropping
    expect(commandOverview).toMatchInlineSnapshot(`
      Array [
        Array [
          "pickUpTip",
          "aspirate",
          "dispense",
          "aspirate",
          "dispense",
          "dropTip",
        ],
        Array [
          "pickUpTip",
          "aspirate",
          "dispense",
          "dropTip",
        ],
        Array [
          "pickUpTip",
          "aspirate",
          "dispense",
          "aspirate",
          "dispense",
          "dropTip",
          "pickUpTip",
          "aspirate",
          "dispense",
          "aspirate",
          "dispense",
          "dropTip",
        ],
      ]
    `)
  })
})
