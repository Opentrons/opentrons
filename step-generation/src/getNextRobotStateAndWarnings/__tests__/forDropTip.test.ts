import { beforeEach, describe, expect, it } from 'vitest'

import { makeImmutableStateUpdater } from '../../__utils__'
import {
  DEFAULT_PIPETTE,
  getInitialRobotStateStandard,
  makeContext,
} from '../../fixtures'
import { forDropTip as _forDropTip } from '../forDropTip'

import type { InvariantContext, RobotState } from '../../types'

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
        pipette: DEFAULT_PIPETTE,
        dropTipLocation: TIPRACK_ID,
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
    it('drop tip if there is a tip from runtime parameters', () => {
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
      invariantContext.runtimeParameters = {
        selected_pipette: {
          variableName: 'selected_pipette',
          displayName: 'Selected pipette',
          type: 'string',
          default: DEFAULT_PIPETTE,
        },
        drop_location: {
          variableName: 'drop_location',
          displayName: 'Drop location',
          type: 'string',
          default: TIPRACK_ID,
        },
        selected_well: {
          variableName: 'selected_well',
          displayName: 'Selected well',
          type: 'string',
          default: 'A1',
        },
      }
      const params = {
        pipette: 'selected_pipette',
        dropTipLocation: 'drop_location',
        wellName: 'selected_well',
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
        pipette: 'p300MultiId',
        dropTipLocation: TIPRACK_ID,
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
