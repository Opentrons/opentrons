import merge from 'lodash/merge'
import { beforeEach, describe, expect, it } from 'vitest'

import { E1_NOZZLE, H1_NOZZLE, QUADRANT } from '@opentrons/shared-data'

import { makeImmutableStateUpdater } from '../../__utils__'
import {
  DEST_LABWARE,
  getInitialRobotStateStandard,
  makeContext,
  MULTI_PIPETTE,
  SOURCE_LABWARE,
  TIPRACK_1,
} from '../../fixtures'
import { createEmptyLiquidState, getLocationTotalVolume } from '../../utils/misc'
import { forAspirate as _forAspirate } from '../forAspirate'
import { forConfigureNozzleLayout as _forConfigureNozzleLayout } from '../forConfigureNozzleLayout'
import { forDispense as _forDispense } from '../forDispense'
import { forPickUpTip as _forPickUpTip } from '../forPickUpTip'

import type { InvariantContext, RobotState } from '../../types'

const forConfigureNozzleLayout = makeImmutableStateUpdater(
  _forConfigureNozzleLayout
)
const forPickUpTip = makeImmutableStateUpdater(_forPickUpTip)
const forAspirate = makeImmutableStateUpdater(_forAspirate)
const forDispense = makeImmutableStateUpdater(_forDispense)

const flowRatesAndOffsets = { flowRate: 35, offsetFromBottomMm: 1 }

describe('QUADRANT partial-column transfer', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState

  beforeEach(() => {
    invariantContext = makeContext()
    robotState = merge({}, getInitialRobotStateStandard(invariantContext), {
      liquidState: createEmptyLiquidState(invariantContext),
    })
    ;['D1', 'E1', 'F1', 'G1'].forEach(well => {
      robotState.liquidState.labware[SOURCE_LABWARE][well] = {
        ingred1: { volume: 200 },
      }
    })
  })

  it('configure, pick up, aspirate, and dispense with four active tips', () => {
    const afterConfigure = forConfigureNozzleLayout(
      {
        pipetteId: MULTI_PIPETTE,
        configurationParams: {
          style: QUADRANT,
          primaryNozzle: H1_NOZZLE,
          backLeftNozzle: E1_NOZZLE,
        },
      },
      invariantContext,
      robotState
    )

    expect(afterConfigure.robotState.pipettes[MULTI_PIPETTE].nozzles).toBe(
      QUADRANT
    )
    expect(
      afterConfigure.robotState.pipettes[MULTI_PIPETTE].backLeftNozzle
    ).toBe(E1_NOZZLE)

    const afterPickUp = forPickUpTip(
      {
        pipetteId: MULTI_PIPETTE,
        labwareId: TIPRACK_1,
        wellName: 'D1',
      },
      invariantContext,
      afterConfigure.robotState
    )

    expect(afterPickUp.robotState.tipState.pipettes[MULTI_PIPETTE].hasTip).toBe(
      true
    )
    expect(
      afterPickUp.robotState.tipState.pipettes[MULTI_PIPETTE].tiprackURI
    ).toBe(TIPRACK_1)
    expect(afterPickUp.robotState.pipettes[MULTI_PIPETTE].tipWell).toBe('D1')

    const afterAspirate = forAspirate(
      {
        ...flowRatesAndOffsets,
        pipetteId: MULTI_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'D1',
        volume: 50,
      },
      invariantContext,
      afterPickUp.robotState
    )

    const pipetteAfterAspirate =
      afterAspirate.robotState.liquidState.pipettes[MULTI_PIPETTE]
    expect(getLocationTotalVolume(pipetteAfterAspirate['0'])).toBeCloseTo(50)
    expect(getLocationTotalVolume(pipetteAfterAspirate['1'])).toBeCloseTo(50)
    expect(getLocationTotalVolume(pipetteAfterAspirate['2'])).toBeCloseTo(50)
    expect(getLocationTotalVolume(pipetteAfterAspirate['3'])).toBeCloseTo(50)
    expect(getLocationTotalVolume(pipetteAfterAspirate['4'])).toBeCloseTo(0)

    const afterDispense = forDispense(
      {
        ...flowRatesAndOffsets,
        flowRate: 50,
        pipetteId: MULTI_PIPETTE,
        labwareId: DEST_LABWARE,
        wellName: 'D1',
        volume: 50,
      },
      invariantContext,
      afterAspirate.robotState
    )

    const plateLiquid = afterDispense.robotState.liquidState.labware[DEST_LABWARE]
    const pipetteAfterDispense =
      afterDispense.robotState.liquidState.pipettes[MULTI_PIPETTE]

    expect(getLocationTotalVolume(plateLiquid.D1)).toBeCloseTo(50)
    expect(getLocationTotalVolume(plateLiquid.E1)).toBeCloseTo(50)
    expect(getLocationTotalVolume(plateLiquid.F1)).toBeCloseTo(50)
    expect(getLocationTotalVolume(plateLiquid.G1)).toBeCloseTo(50)
    expect(getLocationTotalVolume(pipetteAfterDispense['0'])).toBeCloseTo(0)
  })
})
