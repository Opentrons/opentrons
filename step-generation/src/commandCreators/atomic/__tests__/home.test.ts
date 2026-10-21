import { describe, expect, it } from 'vitest'

import { getErrorResult, getSuccessResult } from '../../../fixtures'
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
  it('resolves runtime parameters into the command and python', () => {
    const invariantContext = {
      runtimeParameters: {
        axis_y: {
          variableName: 'axis_y',
          displayName: 'Axis y',
          type: 'string',
          default: 'y',
        },
        mount: {
          variableName: 'mount',
          displayName: 'Mount',
          type: 'string',
          default: 'left',
        },
      },
    } as InvariantContext
    const result = home(
      { axes: ['x', 'axis_y'], skipIfMountPositionOk: 'mount' },
      invariantContext,
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
        'protocol.home(axes=["x", axis_y],\n, skipIfMountPositionOk=mount,\n)',
    })
  })
  it('returns errors if runtime parameters are not valid', () => {
    const invariantContext = {
      runtimeParameters: {
        mock_rtp: {
          variableName: 'mock_rtp',
          displayName: 'mock rtp',
          type: 'boolean',
          default: false,
        },
      },
    } as InvariantContext
    const result = home(
      { axes: ['mock_rtp'], skipIfMountPositionOk: 'mock_rtp' },
      invariantContext,
      {} as RobotState
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
