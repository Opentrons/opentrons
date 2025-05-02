import { describe, expect, it, vi } from 'vitest'

import {
  fixtureTiprack300ul,
  getLabwareDefURI,
  POSITION_REFERENCE_BOTTOM,
} from '@opentrons/shared-data'
import {
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
  it('performs eager tip dropping', () => {
    const allStepArgsAndErrors: StepArgsAndErrorsById = {
      a: {
        errors: false,
        stepArgs: {
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
          blowoutOffsetFromTopMm: 0,
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
          nozzles: null,
          tipRack: getLabwareDefURI(fixtureTiprack300ul as LabwareDefinition2),
          aspirateXOffset: 0,
          aspirateYOffset: 0,
          dispenseXOffset: 0,
          dispenseYOffset: 0,
          pushOut: null,
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
          nozzles: null,
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
          touchTipMmFromTop: -13.81,
          changeTip: 'always',
          blowoutLocation: null,
          pipette: DEFAULT_PIPETTE,
          aspirateFlowRateUlSec: 3.78,
          dispenseFlowRateUlSec: 3.78,
          blowoutFlowRateUlSec: 3.78,
          offsetFromBottomMm: 0.5,
          blowoutOffsetFromTopMm: 0,
          aspirateDelaySeconds: null,
          dispenseDelaySeconds: null,
          nozzles: null,
          tipRack: getLabwareDefURI(fixtureTiprack300ul as LabwareDefinition2),
          xOffset: 0,
          yOffset: 0,
          finalPushOut: 0,
          zOffset: 0,
          positionReference: POSITION_REFERENCE_BOTTOM,
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
      [
        [
          "pickUpTip",
          "moveToWell",
          "liquidProbe",
          "prepareToAspirate",
          "moveToWell",
          "moveToWell",
          "aspirateInPlace",
          "dispense",
          "moveToWell",
          "prepareToAspirate",
          "moveToWell",
          "moveToWell",
          "aspirateInPlace",
          "dispense",
          "moveToAddressableAreaForDropTip",
          "dropTipInPlace",
        ],
        [
          "pickUpTip",
          "moveToWell",
          "liquidProbe",
          "prepareToAspirate",
          "moveToWell",
          "moveToWell",
          "aspirateInPlace",
          "dispense",
          "moveToAddressableAreaForDropTip",
          "dropTipInPlace",
        ],
        [
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

    // The regex elides all the indented arguments in the Python code
    const pythonCommandsOverview = result.timeline.map(frame =>
      frame.python?.replaceAll(/(\n\s+.*)+\n/g, '...')
    )
    expect(pythonCommandsOverview).toEqual([
      // Step a:
      `
mockPythonName.pick_up_tip(location=mockPythonName)
mockPythonName.move_to(mockPythonName["A1"].top(z=2))
mockPythonName.prepare_to_aspirate()
mockPythonName.move_to(mockPythonName["A1"].bottom())
mockPythonName.move_to(mockPythonName["A1"].bottom())
mockPythonName.aspirate(...)
mockPythonName.dispense(...)
mockPythonName.move_to(mockPythonName["A2"].top(z=2))
mockPythonName.prepare_to_aspirate()
mockPythonName.move_to(mockPythonName["A2"].bottom())
mockPythonName.move_to(mockPythonName["A2"].bottom())
mockPythonName.aspirate(...)
mockPythonName.dispense(...)
mockPythonName.drop_tip()
`.trim(),
      // Step b:
      `
mockPythonName.pick_up_tip(location=mockPythonName)
mockPythonName.move_to(mockPythonName["A1"].top(z=2))
mockPythonName.prepare_to_aspirate()
mockPythonName.move_to(mockPythonName["A1"].bottom())
mockPythonName.move_to(mockPythonName["A1"].bottom())
mockPythonName.aspirate(...)
mockPythonName.dispense(...)
mockPythonName.drop_tip()
`.trim(),
      // Step c:
      `
mockPythonName.pick_up_tip(location=mockPythonName)
mockPythonName.flow_rate.aspirate = 3.78
mockPythonName.flow_rate.dispense = 3.78
mockPythonName.mix(...)
mockPythonName.drop_tip()
mockPythonName.pick_up_tip(location=mockPythonName)
mockPythonName.flow_rate.aspirate = 3.78
mockPythonName.flow_rate.dispense = 3.78
mockPythonName.mix(...)
mockPythonName.drop_tip()
`.trim(),
    ])
  })
})
