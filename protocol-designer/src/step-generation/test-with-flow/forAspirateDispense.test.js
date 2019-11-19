// @flow
import { AIR } from '@opentrons/components'
import cloneDeep from 'lodash/cloneDeep'
import forAspirateDispense from '../getNextRobotStateAndWarnings/forAspirateDispense'
import {
  makeContext,
  getRobotStateWithTipStandard,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
} from './fixtures'

let invariantContext
let initialRobotState
beforeEach(() => {
  invariantContext = makeContext()
  initialRobotState = getRobotStateWithTipStandard(invariantContext)
})

describe('Aspirate Command', () => {
  // TODO IMMEDIATELY this should already covered by aspirateUpdateLiquidState. Mock it and make sure it's called already (follow form of forBlowout.test.js)
  test('aspirate from single-ingredient well', () => {
    const well = 'A1'
    const liquidId = 'someLiquidId'
    const initialVolume = 300
    const volume = 152
    const params = {
      pipette: DEFAULT_PIPETTE,
      labware: SOURCE_LABWARE,
      well,
      volume,
      flowRate: 2.22,
      offsetFromBottomMm: 1.11,
    }

    initialRobotState.liquidState.labware[SOURCE_LABWARE][well] = {
      [liquidId]: { volume: initialVolume },
    }

    const result = forAspirateDispense(
      params,
      invariantContext,
      initialRobotState
    )

    const expectedRobotState = cloneDeep(initialRobotState)
    expectedRobotState.liquidState.labware[SOURCE_LABWARE][well] = {
      [liquidId]: { volume: initialVolume - volume },
    }
    expectedRobotState.liquidState.pipettes[DEFAULT_PIPETTE]['0'] = {
      [liquidId]: { volume },
    }

    expect(result).toEqual({
      warnings: [],
      robotState: expectedRobotState,
    })
  })

  test('aspirate from pristine well', () => {
    const well = 'A1'
    const volume = 152
    const params = {
      pipette: DEFAULT_PIPETTE,
      labware: SOURCE_LABWARE,
      well,
      volume,
      flowRate: 2.22,
      offsetFromBottomMm: 1.11,
    }

    const result = forAspirateDispense(
      params,
      invariantContext,
      initialRobotState
    )

    const expectedRobotState = cloneDeep(initialRobotState)
    expectedRobotState.liquidState.pipettes[DEFAULT_PIPETTE]['0'] = {
      [AIR]: { volume },
    }

    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].type).toEqual('ASPIRATE_FROM_PRISTINE_WELL')
    expect(result.robotState).toEqual(expectedRobotState)
  })
})

describe('Dispense command', () => {
  // TODO IMMEDIATELY add cases?
  // TODO IMMEDIATELY is this already covered eg dispenseUpdateLiquidState?

  // TODO Ian 2018-02-12... what is excessive volume?
  // Is it OK to dispense vol > pipette max vol?
  // LATER: shouldn't dispense > volume of liquid in pipette
  test.skip('dispense with excessive volume should... ?', () => {})
})
