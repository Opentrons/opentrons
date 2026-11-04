import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeEvent } from '../make-event'

vi.mock('../selectors')
vi.mock('../../discovery/selectors')
vi.mock('../../pipettes/selectors')

describe('analytics events map', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('events', () => {
    it('analytics:RESOURCE_MONITOR_REPORT -> resourceMonitorReport event', () => {
      const state = {} as any
      const action = {
        type: 'analytics:RESOURCE_MONITOR_REPORT',
        payload: {
          systemAvailMemMb: '500',
          systemUptimeHrs: '111',
          processesDetails: [],
        },
      } as any

      return expect(makeEvent(action, state)).resolves.toEqual({
        name: 'resourceMonitorReport',
        properties: { ...action.payload },
      })
    })
  })
})
