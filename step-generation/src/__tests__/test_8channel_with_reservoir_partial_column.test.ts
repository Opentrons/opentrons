import { describe, expect, it } from 'vitest'

import { E1_NOZZLE, H1_NOZZLE, QUADRANT } from '@opentrons/shared-data'

import analysis from '../fixtures/analysis/test_8channel_with_reservoir_partial_column_analysis.json'
import {
  constructInvariantContextFromAnalysis,
  getResultingTimelineFrameFromRunCommands,
} from '../utils'
import { getLocationTotalVolume } from '../utils/misc'

import type { ProtocolAnalysisOutput, RunTimeCommand } from '@opentrons/shared-data'

const PIPETTE_ID = 'f50e48f1-27f1-44f0-ad60-3f0b4385c7eb'
const PLATE_ID = '369a8457-908c-4078-abe1-10acd9b750eb'
const TIPRACK_ID = '829e1628-b593-426b-a41c-8316fe821952'

const CONFIGURE_NOZZLE_LAYOUT_COMMAND_ID =
  'b0dffd16-7322-4eb6-ab75-c8ad690e5a25'
const PICK_UP_TIP_COMMAND_ID = 'a3024582-998e-4237-8b15-c33cfc1c257f'
const ASPIRATE_IN_PLACE_COMMAND_ID = '3974d30e-6bca-431d-b89b-f80c3c2de981'
const DISPENSE_IN_PLACE_COMMAND_ID = 'dccc4204-d546-4684-a0b3-ff10c5a3c973'

const protocolAnalysis = analysis as unknown as ProtocolAnalysisOutput

function getFrameThroughCommand(commandId: string) {
  const createdDate = new Date(protocolAnalysis.createdAt)
  const invariantContext = constructInvariantContextFromAnalysis(
    protocolAnalysis,
    protocolAnalysis.config,
    createdDate
  )
  const commandIndex = protocolAnalysis.commands.findIndex(
    command => command.id === commandId
  )
  expect(commandIndex).toBeGreaterThanOrEqual(0)
  const commandsSlice = protocolAnalysis.commands.slice(
    0,
    commandIndex + 1
  ) as RunTimeCommand[]

  return getResultingTimelineFrameFromRunCommands(
    commandsSlice,
    invariantContext
  )
}

describe('Test_8channel_with_reservoir partial column fixture', () => {
  it('persists QUADRANT style and backLeftNozzle from configureNozzleLayout', () => {
    const { frame } = getFrameThroughCommand(CONFIGURE_NOZZLE_LAYOUT_COMMAND_ID)
    const pipette = frame.robotState.pipettes[PIPETTE_ID]

    expect(pipette.nozzles).toBe(QUADRANT)
    expect(pipette.primaryNozzle).toBe(H1_NOZZLE)
    expect(pipette.backLeftNozzle).toBe(E1_NOZZLE)
  })

  it('pickUpTip marks pipette as having tips after QUADRANT partial-column configure', () => {
    const { frame } = getFrameThroughCommand(PICK_UP_TIP_COMMAND_ID)
    const pipette = frame.robotState.pipettes[PIPETTE_ID]
    const pipetteTipState = frame.robotState.tipState.pipettes[PIPETTE_ID]

    expect(pipette.nozzles).toBe(QUADRANT)
    expect(pipette.backLeftNozzle).toBe(E1_NOZZLE)
    expect(pipetteTipState.hasTip).toBe(true)
    expect(pipetteTipState.tiprackURI).toBe(TIPRACK_ID)
    expect(pipette.tipWell).toBe('D1')
  })

  it('aspirate from reservoir loads liquid into four active tips', () => {
    const { frame } = getFrameThroughCommand(ASPIRATE_IN_PLACE_COMMAND_ID)
    const pipetteLiquid = frame.robotState.liquidState.pipettes[PIPETTE_ID]

    expect(getLocationTotalVolume(pipetteLiquid['0'])).toBeCloseTo(50)
    expect(getLocationTotalVolume(pipetteLiquid['1'])).toBeCloseTo(50)
    expect(getLocationTotalVolume(pipetteLiquid['2'])).toBeCloseTo(50)
    expect(getLocationTotalVolume(pipetteLiquid['3'])).toBeCloseTo(50)
    expect(getLocationTotalVolume(pipetteLiquid['4'])).toBeCloseTo(0)
  })

  it('dispense to plate distributes liquid to four wells at D1', () => {
    const { frame } = getFrameThroughCommand(DISPENSE_IN_PLACE_COMMAND_ID)
    const plateLiquid = frame.robotState.liquidState.labware[PLATE_ID]
    const pipetteLiquid = frame.robotState.liquidState.pipettes[PIPETTE_ID]

    expect(getLocationTotalVolume(plateLiquid.D1)).toBeCloseTo(50)
    expect(getLocationTotalVolume(plateLiquid.E1)).toBeCloseTo(50)
    expect(getLocationTotalVolume(plateLiquid.F1)).toBeCloseTo(50)
    expect(getLocationTotalVolume(plateLiquid.G1)).toBeCloseTo(50)
    expect(getLocationTotalVolume(pipetteLiquid['0'])).toBeCloseTo(0)
  })

})
