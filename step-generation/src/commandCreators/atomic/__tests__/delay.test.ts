import { describe, expect, it } from 'vitest'

import { getErrorResult, getSuccessResult } from '../../../fixtures'
import { delay } from '../delay'

const getRobotInitialState = (): any => {
  // This particular state shouldn't matter for delay
  return {}
}

// neither should InvariantContext
const invariantContext: any = {}
describe('delay', () => {
  it('should delay until the user clicks resume', () => {
    const robotInitialState = getRobotInitialState()
    const message = 'delay indefinitely message'
    const result = delay({ message }, invariantContext, robotInitialState)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'waitForResume',
        key: expect.any(String),
        params: {
          message,
        },
      },
    ])
    expect(res.python).toEqual(`protocol.pause("delay indefinitely message")`)
  })

  it('should delay for a given duration', () => {
    const robotInitialState = getRobotInitialState()
    const message = 'delay 95.5 secs message'
    const result = delay(
      { message, seconds: 95.5 },
      invariantContext,
      robotInitialState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'waitForDuration',
        key: expect.any(String),
        params: {
          seconds: 95.5,
          message,
        },
      },
    ])
    expect(res.python).toEqual(
      `protocol.delay(seconds=95.5, msg="delay 95.5 secs message")`
    )
  })

  it('should delay with no message', () => {
    const robotInitialState = getRobotInitialState()
    const result = delay({ seconds: 12.3 }, invariantContext, robotInitialState)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'waitForDuration',
        key: expect.any(String),
        params: {
          seconds: 12.3,
        },
      },
    ])
    expect(res.python).toEqual(`protocol.delay(seconds=12.3)`)
  })
  it('resolves runtime parameters into the command and python', () => {
    invariantContext.runtimeParameters = {
      duration: {
        variableName: 'duration',
        displayName: 'Duration',
        type: 'float',
        default: 95.5,
      },
      message: {
        variableName: 'message',
        displayName: 'Message',
        type: 'string',
        default: 'delay 95.5 secs message',
      },
    }
    const result = delay(
      { message: 'message', seconds: 'duration' },
      invariantContext,
      getRobotInitialState()
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'waitForDuration',
        key: expect.any(String),
        params: {
          seconds: 95.5,
          message: 'delay 95.5 secs message',
        },
      },
    ])
    expect(res.python).toEqual(`protocol.delay(seconds=duration, msg=message)`)
  })
  it('returns errors if runtime parameters are not valid', () => {
    invariantContext.runtimeParameters = {
      mock_rtp: {
        variableName: 'mock_rtp',
        displayName: 'mock rtp',
        type: 'boolean',
        default: false,
      },
      mock_string_rtp: {
        variableName: 'mock_string_rtp',
        displayName: 'mock string rtp',
        type: 'string',
        default: 'mock',
      },
    }
    const result = delay(
      { message: 'mock_rtp', seconds: 'mock_string_rtp' },
      invariantContext,
      getRobotInitialState()
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_string_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
