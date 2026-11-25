import { describe, expect, it } from 'vitest'

import { waitForTasks } from '../commandCreators/atomic/waitForTasks'
import { getErrorResult, getSuccessResult } from '../fixtures'

describe('waitForTasks', () => {
  it('should generate a waitForTasks command with the given task ids', () => {
    const invariantContext: any = { runtimeParameters: {} }
    const robotInitialState: any = {}

    const result = waitForTasks(
      { task_ids: ['task-1', 'task-2', 'task-3'] },
      invariantContext,
      robotInitialState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toStrictEqual([
      {
        commandType: 'waitForTasks',
        params: { task_ids: ['task-1', 'task-2', 'task-3'] },
        key: expect.any(String),
      },
    ] satisfies typeof res.commands)
    expect(res.python).toStrictEqual(
      `protocol.wait_for_tasks([task-1, task-2, task-3])`
    )
  })

  it('should handle an empty array of task IDs', () => {
    const invariantContext: any = { runtimeParameters: {} }
    const robotInitialState: any = {}

    const result = waitForTasks(
      { task_ids: [] },
      invariantContext,
      robotInitialState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toStrictEqual([
      {
        commandType: 'waitForTasks',
        params: { task_ids: [] },
        key: expect.any(String),
      },
    ] satisfies typeof res.commands)
    expect(res.python).toStrictEqual(`protocol.wait_for_tasks([])`)
  })

  it('resolves task ids when they are string runtime parameters', () => {
    const invariantContext: any = {
      runtimeParameters: {
        selected_task: {
          variableName: 'selected_task',
          displayName: 'Selected task',
          type: 'string',
          default: 'task-2',
        },
      },
    }
    const robotInitialState: any = {}

    const result = waitForTasks(
      { task_ids: ['task-1', 'selected_task'] },
      invariantContext,
      robotInitialState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toStrictEqual([
      {
        commandType: 'waitForTasks',
        params: { task_ids: ['task-1', 'task-2'] },
        key: expect.any(String),
      },
    ] satisfies typeof res.commands)
    expect(res.python).toStrictEqual(
      `protocol.wait_for_tasks([task-1, task-2])`
    )
  })

  it('returns errors if task ids are not string runtime parameters', () => {
    const invariantContext: any = {
      runtimeParameters: {
        mock_rtp: {
          variableName: 'mock_rtp',
          displayName: 'mock rtp',
          type: 'boolean',
          default: false,
        },
        mock_int_rtp: {
          variableName: 'mock_int_rtp',
          displayName: 'mock int rtp',
          type: 'int',
          default: 1,
        },
      },
    }
    const robotInitialState: any = {}

    const result = waitForTasks(
      { task_ids: ['task-1', 'mock_rtp', 'mock_int_rtp'] },
      invariantContext,
      robotInitialState
    )
    expect(getErrorResult(result).errors).toEqual([
      {
        message: 'Runtime parameter "mock_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
      {
        message: 'Runtime parameter "mock_int_rtp" is missing',
        type: 'INVALID_RUNTIME_PARAMETER',
      },
    ])
  })
})
