import merge from 'lodash/merge'
import { beforeEach, describe, expect, it } from 'vitest'

import { makeImmutableStateUpdater } from '../../__utils__'
import { CLEAN, DIRTY, EMPTY } from '../../constants'
import {
  getInitialRobotStateStandard,
  makeContext,
  tiprackWellNamesFlat,
} from '../../fixtures'
import { forSetTipState as _forSetTipState } from '../forSetTipState'

import type { InvariantContext, RobotState } from '../../types'

const forSetTipState = makeImmutableStateUpdater(_forSetTipState)

describe('forSetTipState', () => {
  let invariantContext: InvariantContext
  let initialRobotState: RobotState

  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
  })

  it('sets specified wells to empty', () => {
    const params = {
      labwareId: 'tiprack2Id',
      wellNames: tiprackWellNamesFlat,
      tipWellState: 'empty' as const,
    }

    const result = forSetTipState(params, invariantContext, initialRobotState)

    expect(
      Object.values(result.robotState.tipState.tipracks.tiprack2Id)
    ).toStrictEqual(Array(96).fill(EMPTY))
  })

  it('sets specified wells to clean', () => {
    const emptiedRobotState = merge({}, initialRobotState, {
      tipState: {
        tipracks: {
          tiprack2Id: {
            A1: EMPTY,
            A2: DIRTY,
            A3: EMPTY,
          },
        },
      },
    })

    const params = {
      labwareId: 'tiprack2Id',
      wellNames: ['A1', 'A2', 'A3'],
      tipWellState: 'clean' as const,
    }

    const result = forSetTipState(params, invariantContext, emptiedRobotState)

    expect(result.robotState).toEqual(
      merge({}, emptiedRobotState, {
        tipState: {
          tipracks: {
            tiprack2Id: {
              A1: CLEAN,
              A2: CLEAN,
              A3: CLEAN,
            },
          },
        },
      })
    )
  })
})
