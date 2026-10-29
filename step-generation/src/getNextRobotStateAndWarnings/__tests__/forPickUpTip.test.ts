import merge from 'lodash/merge'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

import type {
  InvariantContext,
  PickUpTipStepGenArgs,
  RobotState,
} from '../../types'

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
    const params: PickUpTipStepGenArgs = {
      pipetteId: p300SingleId,
      labwareId: tiprack1Id,
      wellName: 'A1',
      primaryNozzle: 'A1',
      nozzles: 'SINGLE',
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
    const params: PickUpTipStepGenArgs = {
      pipetteId: p300MultiId,
      labwareId: 'tiprack1Id',
      wellName: 'A1',
      primaryNozzle: 'A1',
      nozzles: 'COLUMN',
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
  it('single-channel from runtime parameters', () => {
    invariantContext.runtimeParameters = {
      selected_pipette: {
        variableName: 'selected_pipette',
        displayName: 'Selected pipette',
        type: 'string',
        default: p300SingleId,
      },
      selected_tiprack: {
        variableName: 'selected_tiprack',
        displayName: 'Selected tiprack',
        type: 'string',
        default: tiprack1Id,
      },
      selected_well: {
        variableName: 'selected_well',
        displayName: 'Selected well',
        type: 'string',
        default: 'A1',
      },
    }
    const params: PickUpTipStepGenArgs = {
      pipetteId: 'selected_pipette',
      labwareId: 'selected_tiprack',
      wellName: 'selected_well',
      primaryNozzle: 'A1',
      nozzles: 'SINGLE',
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
  // TODO: Ian 2019-11-20 eventually should generate warning (or error?)
  it.todo('multi-channel, missing tip in specified row')
})
