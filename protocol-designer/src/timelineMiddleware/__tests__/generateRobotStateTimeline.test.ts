import { describe, it, expect, vi } from 'vitest'
import {
  getInitialRobotStateStandard,
  makeContext,
  DEFAULT_PIPETTE,
  MULTI_PIPETTE,
  SOURCE_LABWARE,
  DEST_LABWARE,
  FIXED_TRASH_ID,
} from '@opentrons/step-generation'
import { generateRobotStateTimeline } from '../generateRobotStateTimeline'
import type { StepArgsAndErrorsById } from '../../steplist'

vi.mock('../../labware-defs/utils')

describe('generateRobotStateTimeline', () => {
  it('performs eager tip dropping', () => {
    const allStepArgsAndErrors: StepArgsAndErrorsById = {
      a: {
        errors: false,
        stepArgs: {
          dropTipLocation: FIXED_TRASH_ID,
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
          aspirateDelay: null,
          dispenseDelay: null,
          aspirateAirGapVolume: null,
          dispenseAirGapVolume: null,
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
          description: null,
          nozzles: null,
        },
      },
      b: {
        errors: false,
        stepArgs: {
          dropTipLocation: FIXED_TRASH_ID,
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
          aspirateDelay: null,
          dispenseDelay: null,
          aspirateAirGapVolume: null,
          dispenseAirGapVolume: null,
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
          description: null,
          nozzles: null,
        },
      },
      c: {
        errors: false,
        stepArgs: {
          dropTipLocation: FIXED_TRASH_ID,
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
          aspirateDelaySeconds: null,
          dispenseDelaySeconds: null,
          nozzles: null,
        },
      },
    }
    const orderedStepIds = ['a', 'b', 'c']
    const invariantContext = makeContext()
    const initialRobotState = getInitialRobotStateStandard(invariantContext)
    const result = generateRobotStateTimeline({
      allStepArgsAndErrors,
      orderedStepIds,
      initialRobotState,
      invariantContext,
    })
    expect(result.timeline.length).toEqual(orderedStepIds.length)
    expect(result.errors).toBe(null)
    const commandOverview = result.timeline.map(frame =>
      frame.commands.map(command => command.commandType)
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
          "moveToAddressableAreaForDropTip",
          "dropTipInPlace",
        ],
        Array [
          "pickUpTip",
          "aspirate",
          "dispense",
          "moveToAddressableAreaForDropTip",
          "dropTipInPlace",
        ],
        Array [
          "pickUpTip",
          "aspirate",
          "dispense",
          "aspirate",
          "dispense",
          "moveToAddressableAreaForDropTip",
          "dropTipInPlace",
          "pickUpTip",
          "aspirate",
          "dispense",
          "aspirate",
          "dispense",
          "moveToAddressableAreaForDropTip",
          "dropTipInPlace",
        ],
      ]
    `)
  })
})
