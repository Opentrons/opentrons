import { beforeEach, describe, expect, it } from 'vitest'

import { makeImmutableStateUpdater } from '../__utils__'
import {
  DEFAULT_PIPETTE,
  getInitialRobotStateStandard,
  makeContext,
  SOURCE_LABWARE,
} from '../fixtures'
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
            p300SingleId: {
              hasTip: true,
              attachedTipURI: 'tiprackId',
            },
            p300MultiId: {
              hasTip: true,
              attachedTipURI: 'tiprackId',
            },
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
        p300SingleId: {
          hasTip: false,
          attachedTipURI: null,
        },
        p300MultiId: {
          hasTip: true,
          attachedTipURI: 'tiprackId',
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
              attachedTipURI: 'tiprackId',
            },
            p300MultiId: {
              hasTip: true,
              attachedTipURI: 'tiprackId',
            },
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
        p300SingleId: {
          hasTip: true,
          attachedTipURI: 'tiprackId',
        },
        p300MultiId: {
          hasTip: false,
          attachedTipURI: null,
        },
      })
    })
  })
  describe('liquid tracking', () => {
    it('dropTip uses full volume when transfering tip to trash', () => {
      prevRobotState = {
        ...prevRobotState,
        tipState: {
          pipettes: {
            p300SingleId: {
              hasTip: true,
              attachedTipURI: 'tiprackId',
            },
            p300MultiId: {
              hasTip: true,
              attachedTipURI: 'tiprackId',
            },
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
