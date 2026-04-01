import { describe, expect, it } from 'vitest'

import { waitForTasks } from '../commandCreators/atomic/waitForTasks'
import { getSuccessResult } from '../fixtures'

describe('waitForTasks', () => {
  it('should generate a waitForTasks command with the given task ids', () => {
    const invariantContext: any = {}
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
    const invariantContext: any = {}
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
})
