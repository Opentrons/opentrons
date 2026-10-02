import merge from 'lodash/merge'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { E1_NOZZLE, H1_NOZZLE, QUADRANT } from '@opentrons/shared-data'

import { makeImmutableStateUpdater } from '../../__utils__'
import { EMPTY } from '../../constants'
import {
  DEFAULT_PIPETTE,
  getInitialRobotStateStandard,
  getTipColumn,
  makeContext,
} from '../../fixtures'
import { dispenseUpdateLiquidState } from '../dispenseUpdateLiquidState'
import { forPickUpTip as _forPickUpTip } from '../forPickUpTip'

import type { InvariantContext, RobotState } from '../../types'

const forPickUpTip = makeImmutableStateUpdater(_forPickUpTip)
vi.mock('../dispenseUpdateLiquidState')
const tiprack1Id = 'tiprack1Id'
const p300SingleId = DEFAULT_PIPETTE
const p300MultiId = 'p300MultiId'
let invariantContext: InvariantContext
let initialRobotState: RobotState

beforeEach(() => {
  invariantContext = makeContext()
  initialRobotState = getInitialRobotStateStandard(invariantContext)
  vi.mocked(dispenseUpdateLiquidState).mockClear()
})
describe('tip tracking', () => {
  it('single-channel', () => {
    const params = {
      pipetteId: p300SingleId,
      labwareId: tiprack1Id,
      wellName: 'A1',
    }
    const result = forPickUpTip(params, invariantContext, initialRobotState)
    expect(result.warnings).toEqual([])
    expect(result.robotState).toEqual(
      merge({}, initialRobotState, {
        pipettes: {
          ...initialRobotState.pipettes,
          [p300SingleId]: {
            ...initialRobotState.pipettes[p300SingleId],
            tipWell: 'A1',
          },
        },
        tipState: {
          tipracks: {
            [tiprack1Id]: {
              A1: EMPTY,
            },
          },
          pipettes: {
            [p300SingleId]: {
              hasTip: true,
              tiprackURI: tiprack1Id,
            },
          },
        },
      })
    )
  })
  it('multi-channel', () => {
    const params = {
      pipetteId: p300MultiId,
      labwareId: 'tiprack1Id',
      wellName: 'A1',
    }
    const result = forPickUpTip(params, invariantContext, initialRobotState)
    expect(result.warnings).toEqual([])
    expect(result.robotState).toEqual(
      merge({}, initialRobotState, {
        pipettes: {
          ...initialRobotState.pipettes,
          [p300MultiId]: {
            ...initialRobotState.pipettes[p300MultiId],
            tipWell: 'A1',
          },
        },
        tipState: {
          tipracks: {
            [tiprack1Id]: getTipColumn(1, EMPTY),
          },
          pipettes: {
            [p300MultiId]: {
              hasTip: true,
              tiprackURI: tiprack1Id,
            },
          },
        },
      })
    )
  })
  // TODO: Ian 2019-11-20 eventually should generate warning (or error?)
  it.todo('multi-channel, missing tip in specified row')

  it('QUADRANT partial-column pickup clears four tips ending at primary well', () => {
    const robotStateWithQuadrantConfig = merge({}, initialRobotState, {
      pipettes: {
        [p300MultiId]: {
          ...initialRobotState.pipettes[p300MultiId],
          nozzles: QUADRANT,
          primaryNozzle: H1_NOZZLE,
          backLeftNozzle: E1_NOZZLE,
        },
      },
    })

    const result = forPickUpTip(
      {
        pipetteId: p300MultiId,
        labwareId: tiprack1Id,
        wellName: 'D1',
      },
      invariantContext,
      robotStateWithQuadrantConfig
    )

    expect(result.robotState.pipettes[p300MultiId].tipWell).toBe('D1')
    expect(result.robotState.tipState.pipettes[p300MultiId]).toEqual({
      hasTip: true,
      tiprackURI: tiprack1Id,
    })
    expect(result.robotState.tipState.tipracks[tiprack1Id].A1).toBe(EMPTY)
    expect(result.robotState.tipState.tipracks[tiprack1Id].B1).toBe(EMPTY)
    expect(result.robotState.tipState.tipracks[tiprack1Id].C1).toBe(EMPTY)
    expect(result.robotState.tipState.tipracks[tiprack1Id].D1).toBe(EMPTY)
    expect(result.robotState.tipState.tipracks[tiprack1Id].E1).not.toBe(EMPTY)
  })
})
