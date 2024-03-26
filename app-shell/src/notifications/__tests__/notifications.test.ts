import { vi, describe, it, expect, beforeEach } from 'vitest'

import { registerNotify, closeAllNotifyConnections } from '..'
import { connectionStore } from '../store'
import { subscribe } from '../subscribe'
import { closeConnectionsForcefullyFor } from '../connect'

import type { Mock } from 'vitest'

vi.mock('electron-store')
vi.mock('../store')
vi.mock('../subscribe')
vi.mock('../connect')
vi.mock('../notifyLog', () => {
  return {
    createLogger: () => {
      return { debug: () => null }
    },
    notifyLog: { debug: vi.fn() },
  }
})

const MOCK_ACTION = {
  type: 'shell:NOTIFY_SUBSCRIBE',
  payload: { hostname: 'localhost', topic: 'ALL_TOPICS' },
  meta: { shell: true },
} as any

describe('registerNotify', () => {
  let dispatch: Mock
  let mainWindow: Mock

  beforeEach(() => {
    dispatch = vi.fn()
    mainWindow = vi.fn()
  })

  it('should set browser window when connectionStore has no browser window', () => {
    registerNotify(dispatch, mainWindow as any)(MOCK_ACTION)

    expect(connectionStore.setBrowserWindow).toHaveBeenCalledWith(mainWindow)
  })

  it('should subscribe when action type is shell:NOTIFY_SUBSCRIBE', () => {
    registerNotify(dispatch, mainWindow as any)(MOCK_ACTION)

    expect(vi.mocked(subscribe)).toHaveBeenCalledWith(
      MOCK_ACTION.payload.hostname,
      MOCK_ACTION.payload.topic
    )
  })
})

describe('closeAllNotifyConnections', () => {
  it('should reject with an error when failed to close all connections within the time limit', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(closeConnectionsForcefullyFor).mockResolvedValue([])
    const promise = closeAllNotifyConnections()
    vi.advanceTimersByTime(2000)

    await expect(promise).rejects.toThrowError(
      'Failed to close all connections within the time limit.'
    )
  })
})
