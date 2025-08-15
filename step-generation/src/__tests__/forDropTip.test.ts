import { beforeEach, describe, expect, it } from 'vitest'

import { makeImmutableStateUpdater } from '../__utils__'
import {
  DEFAULT_PIPETTE,
  getInitialRobotStateStandard,
  makeContext,
} from '../fixtures'
import { forDropTip as _forDropTip } from '../getNextRobotStateAndWarnings/forDropTip'

import type { InvariantContext, RobotState } from '../types'

const forDropTip = makeImmutableStateUpdater(_forDropTip)

const TIPRACK_ID = 'tiprack1Id'

describe('dropTip', () => {
  let invariantContext: InvariantContext
  let prevRobotState: RobotState
  beforeEach(() => {
    invariantContext = makeContext()
    prevRobotState = getInitialRobotStateStandard(invariantContext)
  })

  describe('replaceTip: single channel', () => {
    it('drop tip if there is a tip', () => {
      prevRobotState = {
        ...prevRobotState,
        tipState: {
          pipettes: {
            p300SingleId: {
              hasTip: true,
              tiprackURI: 'tiprackId',
            },
            p300MultiId: {
              hasTip: true,
              tiprackURI: 'tiprackId',
            },
          },
          tipracks: {
            tiprack1Id: {},
          } as any,
        },
      }
      const params = {
        pipetteId: DEFAULT_PIPETTE,
        labwareId: TIPRACK_ID,
        wellName: 'A1',
      }
      const result = forDropTip(params, invariantContext, prevRobotState)
      expect(result.robotState.tipState.pipettes).toEqual({
        p300SingleId: {
          hasTip: false,
          tiprackURI: null,
        },
        p300MultiId: {
          hasTip: true,
          tiprackURI: 'tiprackId',
        },
      })
    })
    // TODO: IL 2019-11-20
    it.todo('no tip on pipette')
  })
  describe('Multi-channel dropTip', () => {
    it('drop tip when there are tips', () => {
      prevRobotState = {
        ...prevRobotState,
        tipState: {
          pipettes: {
            p300SingleId: {
              hasTip: true,
              tiprackURI: 'tiprackId',
            },
            p300MultiId: {
              hasTip: true,
              tiprackURI: 'tiprackId',
            },
          },
          tipracks: {
            [TIPRACK_ID]: {},
          } as any,
        },
      }
      const params = {
        pipetteId: 'p300MultiId',
        labwareId: TIPRACK_ID,
        wellName: 'A1',
      }
      const result = forDropTip(params, invariantContext, prevRobotState)
      expect(result.robotState.tipState.pipettes).toEqual({
        p300SingleId: {
          hasTip: true,
          tiprackURI: 'tiprackId',
        },
        p300MultiId: {
          hasTip: false,
          tiprackURI: null,
        },
      })
    })
  })
})
