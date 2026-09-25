import { describe, expect, it } from 'vitest'

import { getSuccessResult } from '../../../fixtures'
import { home } from '../home'

import type { InvariantContext, RobotState } from '../../../types'

describe('home', () => {
  it('generates JSON and python with no optional params', () => {
    const result = home({}, {} as InvariantContext, {} as RobotState)
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'home',
          key: expect.any(String),
          params: {},
        },
      ],
      python: 'protocol.home()',
    })
  })

  it('generates JSON and python with axes and skipIfMountPositionOk', () => {
    const result = home(
      { axes: ['x', 'y'], skipIfMountPositionOk: 'left' },
      {} as InvariantContext,
      {} as RobotState
    )
    expect(getSuccessResult(result)).toEqual({
      commands: [
        {
          commandType: 'home',
          key: expect.any(String),
          params: {
            axes: ['x', 'y'],
            skipIfMountPositionOk: 'left',
          },
        },
      ],
      python:
        'protocol.home(axes=["x", "y"],\n, skipIfMountPositionOk="left",\n)',
    })
  })
})
