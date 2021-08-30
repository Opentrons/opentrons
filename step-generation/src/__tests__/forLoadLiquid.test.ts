import {
  makeContext,
  getInitialRobotStateStandard,
  SOURCE_LABWARE,
} from '../fixtures'
import { FIXED_TRASH_ID } from '../constants'
import { makeImmutableStateUpdater } from '../__utils__'
import { forLoadLiquid as _forLoadLiquid } from '../getNextRobotStateAndWarnings/forLoadLiquid'
import { InvariantContext } from '../types'

const forLoadLiquid = makeImmutableStateUpdater(_forLoadLiquid)

describe('loadLiquid', () => {
  let invariantContext: InvariantContext
  beforeEach(() => {
    invariantContext = makeContext()
  })

  describe('liquid tracking', () => {
    it('initializes well liquid volume for empty wells', () => {
      const robotState = getInitialRobotStateStandard(invariantContext)
      const params = {
        liquidId: 'ingred1',
        labwareId: FIXED_TRASH_ID,
        volumeByWell: { A1: 150 },
      }
      const result = forLoadLiquid(params, invariantContext, robotState)
      expect(result).toMatchObject({
        robotState: {
          liquidState: {
            pipettes: {},
            labware: {
              [FIXED_TRASH_ID]: {
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

    it('overwrites any existing liquid volume in well', () => {
      const robotState = getInitialRobotStateStandard(invariantContext)
      const robotStateWithInitialLiquid = {
        ...robotState,
        liquidState: {
          ...robotState.liquidState,
          labware: {
            [FIXED_TRASH_ID]: {
              A1: { ingred1: { volume: 300 } },
            },
          },
        },
      }
      const params = {
        liquidId: 'ingred1',
        labwareId: FIXED_TRASH_ID,
        volumeByWell: { A1: 150 },
      }
      const result = forLoadLiquid(
        params,
        invariantContext,
        robotStateWithInitialLiquid
      )
      expect(result).toMatchObject({
        robotState: {
          liquidState: {
            pipettes: {},
            labware: {
              [FIXED_TRASH_ID]: {
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

    it('initializes liquid volume in multiple wells', () => {
      const robotState = getInitialRobotStateStandard(invariantContext)
      const params = {
        liquidId: 'ingred1',
        labwareId: SOURCE_LABWARE,
        volumeByWell: { A1: 150, B2: 200, C3: 250, D4: 300 },
      }
      const result = forLoadLiquid(params, invariantContext, robotState)
      expect(result).toMatchObject({
        robotState: {
          liquidState: {
            pipettes: {},
            labware: {
              [SOURCE_LABWARE]: {
                A1: { ingred1: { volume: 150 } },
                B2: { ingred1: { volume: 200 } },
                C3: { ingred1: { volume: 250 } },
                D4: { ingred1: { volume: 300 } },
              },
            },
          },
        },
      })
    })
  })
})
