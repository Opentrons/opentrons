import { describe, expect, it } from 'vitest'

import { makeContext, makeState } from '../fixtures'
import { createEmptyLiquidState } from '../utils'

describe('snapshot tests', () => {
  it('makeContext', () => {
    expect(makeContext()).toMatchSnapshot()
  })
  it('makeState', () => {
    expect(
      makeState({
        invariantContext: makeContext(),
        labwareLocations: {
          tiprack1Id: {
            stack: ['tiprack1Id', '1'],
          },
          tiprack2Id: {
            stack: ['tiprack2Id', '2'],
          },
          sourcePlateId: {
            stack: ['sourcePlateId', '4'],
          },
          tiprack4AdapterId: {
            stack: ['tiprack4AdapterId', '7'],
          },
          tiprack5AdapterId: {
            stack: ['tiprack5AdapterId', '8'],
          },
          tiprack4Id: {
            stack: ['tiprack4Id', 'tiprack4AdapterId', '7'],
          },
          tiprack5Id: {
            stack: ['tiprack5Id', 'tiprack5AdapterId', '8'],
          },
        },
        pipetteLocations: {
          p300SingleId: {
            mount: 'left',
          },
        },
        tiprackSetting: {
          tiprack1Id: true,
          tiprack2Id: false,
        },
      })
    ).toMatchSnapshot()
  })
  it('createEmptyLiquidState', () => {
    expect(createEmptyLiquidState(makeContext())).toMatchSnapshot()
  })
})
