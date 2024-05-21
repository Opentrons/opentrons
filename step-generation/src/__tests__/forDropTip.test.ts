import { beforeEach, describe, it, expect } from 'vitest'
import {
  makeContext,
  getInitialRobotStateStandard,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
} from '../fixtures'
import { makeImmutableStateUpdater } from '../__utils__'
import { forDropTip as _forDropTip } from '../getNextRobotStateAndWarnings/forDropTip'
import type { InvariantContext, RobotState } from '../types'
const forDropTip = makeImmutableStateUpdater(_forDropTip)

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
            p300SingleId: true,
            p300MultiId: true,
          },
          tipracks: {} as any,
        },
      }
      const params = {
        pipetteId: DEFAULT_PIPETTE,
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
      }
      const result = forDropTip(params, invariantContext, prevRobotState)
      expect(result.robotState.tipState.pipettes).toEqual({
        p300SingleId: false,
        p300MultiId: true,
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
            p300SingleId: true,
            p300MultiId: true,
          },
          tipracks: {} as any,
        },
      }
      const params = {
        pipetteId: 'p300MultiId',
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
      }
      const result = forDropTip(params, invariantContext, prevRobotState)
      expect(result.robotState.tipState.pipettes).toEqual({
        p300SingleId: true,
        p300MultiId: false,
      })
    })
  })
  describe('liquid tracking', () => {
    it('dropTip uses full volume when transfering tip to trash', () => {
      prevRobotState = {
        ...prevRobotState,
        tipState: {
          pipettes: {
            p300SingleId: true,
            p300MultiId: true,
          },
          tipracks: {} as any,
        },
      }
      const params = {
        pipetteId: 'p300MultiId',
        labwareId: SOURCE_LABWARE,
        wellName: 'A1',
      }
      prevRobotState.liquidState.pipettes.p300MultiId['0'] = {
        ingred1: {
          volume: 150,
        },
      }
      const result = forDropTip(params, invariantContext, prevRobotState)
      expect(result).toMatchObject({
        robotState: {
          liquidState: {
            pipettes: {
              p300MultiId: {
                '0': {
                  ingred1: {
                    volume: 0,
                  },
                },
              },
            },
            labware: {
              [SOURCE_LABWARE]: {
                A1: {
                  ingred1: {
                    volume: 150,
                  },
                },
              },
            },
          },
        },
      })
    })
  })
})
