import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  A1_NOZZLE,
  ALL,
  fixtureTiprack300ul,
  getLabwareDefURI,
  POSITION_REFERENCE_BOTTOM,
} from '@opentrons/shared-data'
import {
  AUTOMATIC,
  DEFAULT_PIPETTE,
  DEST_LABWARE,
  FIXED_TRASH_ID,
  getInitialRobotStateStandard,
  makeContext,
  MULTI_PIPETTE,
  SOURCE_LABWARE,
} from '@opentrons/step-generation'

import { generateRobotStateTimeline } from '../generateRobotStateTimeline'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { StepArgsAndErrorsById } from '../../steplist'

vi.mock('../../labware-defs/utils')

describe('generateRobotStateTimeline', () => {
  let allStepArgsAndErrors: StepArgsAndErrorsById
  beforeEach(() => {
    allStepArgsAndErrors = {
      a: {
        errors: false,
        stepArgs: {
          stepNumber: 1,
          primaryNozzle: A1_NOZZLE,
          dropTipLocation: FIXED_TRASH_ID,
          pipette: DEFAULT_PIPETTE,
          volume: 5,
          sourceLabware: SOURCE_LABWARE,
          touchTipAfterAspirateMmFromEdge: null,
          liquidClass: null,
          aspiratePositionReference: POSITION_REFERENCE_BOTTOM,
          aspirateZOffset: 0,
          aspirateSubmergeSpeed: null,
          aspirateSubmergeXOffset: 0,
          aspirateSubmergeYOffset: 0,
          aspirateSubmergeZOffset: 0,
          aspirateSubmergePositionReference: POSITION_REFERENCE_BOTTOM,
          aspirateSubmergeDelay: null,
          aspirateRetractSpeed: null,
          aspirateRetractXOffset: 0,
          aspirateRetractYOffset: 0,
          aspirateRetractZOffset: 0,
          aspirateRetractPositionReference: POSITION_REFERENCE_BOTTOM,
          aspirateRetractDelay: null,
          dispenseSubmergeSpeed: null,
          dispenseSubmergeXOffset: 0,
          dispenseSubmergeYOffset: 0,
          dispenseSubmergeZOffset: 0,
          dispenseSubmergePositionReference: POSITION_REFERENCE_BOTTOM,
          dispenseRetractSpeed: null,
          dispenseRetractXOffset: 0,
          dispenseRetractYOffset: 0,
          dispenseRetractZOffset: 0,
          dispenseRetractPositionReference: POSITION_REFERENCE_BOTTOM,
          destLabware: DEST_LABWARE,
          aspirateFlowRateUlSec: 3.78,
          dispenseFlowRateUlSec: 3.78,
          aspirateOffsetFromBottomMm: 1,
          dispenseOffsetFromBottomMm: 0.5,
          blowoutFlowRateUlSec: 3.78,
          blowoutOffsetFromTopMm: null,
          blowoutXPosition: null,
          blowoutYPosition: null,
          blowoutPositionReference: null,
          changeTip: 'once',
          preWetTip: false,
          aspirateDelay: null,
          dispenseDelay: null,
          aspirateAirGapVolume: null,
          dispenseAirGapVolume: null,
          mixInDestination: null,
          touchTipAfterAspirate: false,
          touchTipAfterAspirateOffsetMmFromTop: -13.81,
          touchTipAfterAspirateSpeed: null,
          touchTipAfterDispense: false,
          touchTipAfterDispenseOffsetMmFromTop: -13.81,
          touchTipAfterDispenseSpeed: null,
          name: 'transfer',
          commandCreatorFnName: 'transfer',
          blowoutLocation: null,
          sourceWells: ['A1', 'A2'],
          destWells: ['A12', 'A12'],
          mixBeforeAspirate: null,
          description: null,
          nozzles: ALL,
          tipRack: getLabwareDefURI(fixtureTiprack300ul as LabwareDefinition2),
          aspirateXOffset: 0,
          aspirateYOffset: 0,
          dispenseXOffset: 0,
          dispenseYOffset: 0,
          pushOut: null,
          dispenseZOffset: 0,
          dispensePositionReference: POSITION_REFERENCE_BOTTOM,
          touchTipAfterDispenseMmFromEdge: 0,
          dispenseSubmergeDelay: null,
          dispenseRetractDelay: null,
          tipTracking: AUTOMATIC,
          tipsSelected: [],
          tiprackSelected: null,
        },
      },
      b: {
        errors: false,
        stepArgs: {
          primaryNozzle: A1_NOZZLE,
          stepNumber: 1,
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
          blowoutOffsetFromTopMm: null,
          blowoutXPosition: null,
          blowoutYPosition: null,
          blowoutPositionReference: null,
          changeTip: 'always',
          preWetTip: false,
          aspirateDelay: null,
          dispenseDelay: null,
          aspirateAirGapVolume: null,
          dispenseAirGapVolume: null,
          mixInDestination: null,
          touchTipAfterAspirate: false,
          touchTipAfterAspirateOffsetMmFromTop: -13.81,
          touchTipAfterAspirateSpeed: null,
          touchTipAfterDispense: false,
          touchTipAfterDispenseOffsetMmFromTop: -13.81,
          touchTipAfterDispenseSpeed: null,
          name: 'transfer',
          commandCreatorFnName: 'transfer',
          blowoutLocation: null,
          sourceWells: ['A1'],
          destWells: ['A12'],
          mixBeforeAspirate: null,
          description: null,
          nozzles: ALL,
          tipRack: getLabwareDefURI(fixtureTiprack300ul as LabwareDefinition2),
          aspirateXOffset: 0,
          aspirateYOffset: 0,
          dispenseXOffset: 0,
          dispenseYOffset: 0,
          pushOut: null,
          touchTipAfterAspirateMmFromEdge: null,
          liquidClass: null,
          aspiratePositionReference: POSITION_REFERENCE_BOTTOM,
          aspirateZOffset: 0,
          aspirateSubmergeSpeed: null,
          aspirateSubmergeXOffset: 0,
          aspirateSubmergeYOffset: 0,
          aspirateSubmergeZOffset: 0,
          aspirateSubmergePositionReference: POSITION_REFERENCE_BOTTOM,
          aspirateSubmergeDelay: null,
          aspirateRetractSpeed: null,
          aspirateRetractXOffset: 0,
          aspirateRetractYOffset: 0,
          aspirateRetractZOffset: 0,
          aspirateRetractPositionReference: POSITION_REFERENCE_BOTTOM,
          aspirateRetractDelay: null,
          dispenseSubmergeSpeed: null,
          dispenseSubmergeXOffset: 0,
          dispenseSubmergeYOffset: 0,
          dispenseSubmergeZOffset: 0,
          dispenseSubmergePositionReference: POSITION_REFERENCE_BOTTOM,
          dispenseRetractSpeed: null,
          dispenseRetractXOffset: 0,
          dispenseRetractYOffset: 0,
          dispenseRetractZOffset: 0,
          dispenseRetractPositionReference: POSITION_REFERENCE_BOTTOM,
          dispenseZOffset: 0,
          dispensePositionReference: POSITION_REFERENCE_BOTTOM,
          touchTipAfterDispenseMmFromEdge: 0,
          dispenseSubmergeDelay: null,
          dispenseRetractDelay: null,
          tipTracking: AUTOMATIC,
          tipsSelected: [],
          tiprackSelected: null,
        },
      },
      c: {
        errors: false,
        stepArgs: {
          dropTipLocation: FIXED_TRASH_ID,
          primaryNozzle: A1_NOZZLE,
          commandCreatorFnName: 'mix',
          name: 'Mix',
          description: 'description would be here 2018-03-01',
          labware: SOURCE_LABWARE,
          wells: ['A2', 'A3'],
          volume: 5,
          times: 2,
          touchTip: false,
          touchTipMmFromTop: -13.81,
          changeTip: 'always',
          blowoutLocation: null,
          pipette: DEFAULT_PIPETTE,
          aspirateFlowRateUlSec: 3.78,
          dispenseFlowRateUlSec: 3.78,
          blowoutFlowRateUlSec: 3.78,
          blowoutOffsetFromTopMm: 0,
          aspirateDelaySeconds: null,
          dispenseDelaySeconds: null,
          nozzles: ALL,
          tipRack: getLabwareDefURI(fixtureTiprack300ul as LabwareDefinition2),
          positionReference: POSITION_REFERENCE_BOTTOM,
          xOffset: 0,
          yOffset: 0,
          zOffset: 0.5,
          finalPushOut: 0,
          tipTracking: AUTOMATIC,
          tipsSelected: [],
          tiprackSelected: null,
        },
      },
    }
  })

  it('performs eager tip dropping', () => {
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
      [
        [
          "pickUpTip",
          "moveToWell",
          "prepareToAspirate",
          "moveToWell",
          "moveToWell",
          "aspirateInPlace",
          "moveToWell",
          "moveToWell",
          "moveToWell",
          "dispenseInPlace",
          "moveToWell",
          "moveToWell",
          "prepareToAspirate",
          "moveToWell",
          "moveToWell",
          "aspirateInPlace",
          "moveToWell",
          "moveToWell",
          "moveToWell",
          "dispenseInPlace",
          "moveToWell",
          "moveToAddressableAreaForDropTip",
          "dropTipInPlace",
        ],
        [
          "configureNozzleLayout",
          "pickUpTip",
          "moveToWell",
          "prepareToAspirate",
          "moveToWell",
          "moveToWell",
          "aspirateInPlace",
          "moveToWell",
          "moveToWell",
          "moveToWell",
          "dispenseInPlace",
          "moveToWell",
          "moveToAddressableAreaForDropTip",
          "dropTipInPlace",
        ],
        [
          "pickUpTip",
          "moveToWell",
          "aspirateInPlace",
          "dispenseInPlace",
          "aspirateInPlace",
          "dispenseInPlace",
          "moveToAddressableAreaForDropTip",
          "dropTipInPlace",
          "pickUpTip",
          "moveToWell",
          "aspirateInPlace",
          "dispenseInPlace",
          "aspirateInPlace",
          "dispenseInPlace",
          "moveToAddressableAreaForDropTip",
          "dropTipInPlace",
        ],
      ]
    `)

    // The regex elides all the indented arguments in the Python code
    const pythonCommandsOverview = result.timeline.map(frame =>
      frame.python?.replaceAll(/(\n\s+.*)+\n/g, '...')
    )
    expect(pythonCommandsOverview).toEqual([
      // Step a:
      `
mock_pipette.transfer_with_liquid_class(...)
mock_pipette.drop_tip()
`.trim(),
      // Step b:
      `
mock_pipette_p300_multi.configure_nozzle_layout(...)
mock_pipette_p300_multi.transfer_with_liquid_class(...)
mock_pipette_p300_multi.drop_tip()
`.trim(),
      // Step c:
      `
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.mix(...)
mock_pipette.drop_tip()
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.mix(...)
mock_pipette.drop_tip()
`.trim(),
    ])
  })

  it('does not perform eager tip dropping if the step returns tip', () => {
    allStepArgsAndErrors = {
      ...allStepArgsAndErrors,
      a: {
        ...allStepArgsAndErrors.a,
        stepArgs: {
          ...allStepArgsAndErrors.a.stepArgs,
          dropTipLocation: getLabwareDefURI(
            fixtureTiprack300ul as LabwareDefinition2
          ),
        },
      },
    } as StepArgsAndErrorsById
    const orderedStepIds = ['a', 'b', 'c']
    const invariantContext = makeContext()
    const initialRobotState = getInitialRobotStateStandard(invariantContext)
    const result = generateRobotStateTimeline({
      allStepArgsAndErrors,
      orderedStepIds,
      initialRobotState,
      invariantContext,
    })
    expect(result.errors).toBe(null)

    // The regex elides all the indented arguments in the Python code
    const pythonCommandsOverview = result.timeline.map(frame =>
      frame.python?.replaceAll(/(\n\s+.*)+\n/g, '...')
    )
    expect(pythonCommandsOverview).toEqual([
      // Step a:
      `
mock_pipette.transfer_with_liquid_class(...)
`.trim(),
      // Step b:
      `
mock_pipette_p300_multi.configure_nozzle_layout(...)
mock_pipette_p300_multi.transfer_with_liquid_class(...)
mock_pipette_p300_multi.drop_tip()
`.trim(),
      // Step c:
      `
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.mix(...)
mock_pipette.drop_tip()
mock_pipette.pick_up_tip(location=mock_tip_rack_1)
mock_pipette.mix(...)
mock_pipette.drop_tip()
`.trim(),
    ])
  })
})
