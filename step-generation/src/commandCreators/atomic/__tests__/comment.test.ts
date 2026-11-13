import { describe, expect, it } from 'vitest'

import { getErrorResult, getSuccessResult } from '../../../fixtures'
import { comment } from '../comment'

describe('comment', () => {
  it('should generate comment command', () => {
    // InvariantContext and RobotState don't matter for comment.
    const invariantContext: any = {}
    const robotInitialState: any = {}

    const message = 'I am a comment'
    const result = comment({ message }, invariantContext, robotInitialState)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'comment',
        key: expect.any(String),
        params: { message },
      },
    ])
    expect(res.python).toEqual(`protocol.comment("I am a comment")`)
  })
  it('resolves message when it is a string runtime parameter', () => {
    const invariantContext = {
      runtimeParameters: {
        message: {
          variableName: 'message',
          displayName: 'Message',
          type: 'string',
          default: 'I am a comment',
        },
      },
    }
    const result = comment(
      { message: 'message' },
      invariantContext as any,
      {} as any
    )
    expect(result).toEqual({
      commands: [
        {
          commandType: 'comment',
          key: expect.any(String),
          params: { message: 'I am a comment' },
        },
      ],
      python: 'protocol.comment(message)',
    })
  })
  it('returns error if message is not a string runtime parameter', () => {
    const invariantContext = {
      runtimeParameters: {
        mock_rtp: {
          variableName: 'mock_rtp',
          displayName: 'mock rtp',
          type: 'boolean',
          default: false,
        },
      },
    }
    const result = comment(
      { message: 'mock_rtp' },
      invariantContext as any,
      {} as any
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
