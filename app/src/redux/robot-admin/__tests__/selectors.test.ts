import { CONNECTABLE, REACHABLE } from '../../discovery'
import {
  getRobotRestarting,
  getNextRestartStatus,
  getResetConfigOptions,
} from '../selectors'
import { ConnectivityStatus } from '../../discovery/types'
import type { State } from '../../types'

const START_TIME = new Date('2000-01-01')

const RESTART_BASE = {
  bootId: null,
  startTime: START_TIME,
}

describe('robot admin selectors', () => {
  describe('get reset config options', () => {
    it('should return empty array by default', () => {
      const state: State = { robotAdmin: {} } as any

      const result = getResetConfigOptions(state, 'robotName')

      expect(result).toEqual([])
    })

    it('should return options from state', () => {
      const state: State = {
        robotAdmin: {
          robotName: {
            resetConfigOptions: [
              { id: 'foo', name: 'Foo', description: 'foobar' },
              { id: 'baz', name: 'Baz', description: 'bazqux' },
            ],
          },
        },
      } as any

      const result = getResetConfigOptions(state, 'robotName')

      expect(result).toEqual([
        { id: 'foo', name: 'Foo', description: 'foobar' },
        { id: 'baz', name: 'Baz', description: 'bazqux' },
      ])
    })
  })

  describe('get robot restarting', () => {
    it('should return true if restart status is pending or in progress', () => {
      const state: State = {
        robotAdmin: {
          succeeded: {
            restart: { ...RESTART_BASE, status: 'restart-succeeded' },
          },
          failed: { restart: { ...RESTART_BASE, status: 'restart-failed' } },
          timedOut: {
            restart: { ...RESTART_BASE, status: 'restart-timed-out' },
          },
          pending: { restart: { ...RESTART_BASE, status: 'restart-pending' } },
          inProgress: {
            restart: { ...RESTART_BASE, status: 'restart-in-progress' },
          },
        },
      } as any

      expect(getRobotRestarting(state, 'succeeded')).toBe(false)
      expect(getRobotRestarting(state, 'failed')).toBe(false)
      expect(getRobotRestarting(state, 'pending')).toBe(true)
      expect(getRobotRestarting(state, 'inProgress')).toBe(true)
    })
  })

  describe('get next robot restarting status', () => {
    it('should return null if robot is not restarting', () => {
      const state: State = {
        robotAdmin: {
          succeeded: {
            restart: { ...RESTART_BASE, status: 'restart-succeeded' },
          },
          failed: { restart: { ...RESTART_BASE, status: 'restart-failed' } },
          timedOut: {
            restart: { ...RESTART_BASE, status: 'restart-timed-out' },
          },
        },
      } as any

      const baseArgs: [ConnectivityStatus, string | null, Date] = [
        CONNECTABLE,
        'boot-id',
        new Date(),
      ]

      expect(getNextRestartStatus(state, 'nonExistent', ...baseArgs)).toBe(null)
      expect(getNextRestartStatus(state, 'succeeded', ...baseArgs)).toBe(null)
      expect(getNextRestartStatus(state, 'failed', ...baseArgs)).toBe(null)
      expect(getNextRestartStatus(state, 'timedOut', ...baseArgs)).toBe(null)
    })

    it('should return restart success if connectable robot has new boot ID', () => {
      const state: State = {
        robotAdmin: {
          robotName: {
            restart: { ...RESTART_BASE, status: 'restart-pending' },
          },
        },
      } as any

      const result = getNextRestartStatus(
        state,
        'robotName',
        CONNECTABLE,
        'shiny-new-boot-id',
        START_TIME
      )

      expect(result).toBe('restart-succeeded')
    })

    it('should return restart success if was restarting and is now connectable', () => {
      const state: State = {
        robotAdmin: {
          robotName: {
            restart: { ...RESTART_BASE, status: 'restart-in-progress' },
          },
        },
      } as any

      const result = getNextRestartStatus(
        state,
        'robotName',
        CONNECTABLE,
        null,
        START_TIME
      )

      expect(result).toBe('restart-succeeded')
    })

    it('should return null if no new boot ID and restart still pending', () => {
      const state: State = {
        robotAdmin: {
          robotName: {
            restart: { ...RESTART_BASE, status: 'restart-pending' },
          },
        },
      } as any

      const result = getNextRestartStatus(
        state,
        'robotName',
        CONNECTABLE,
        null,
        START_TIME
      )

      expect(result).toBe(null)
    })

    it('should return null if new boot ID but robot not yet connectable', () => {
      const state: State = {
        robotAdmin: {
          robotName: {
            restart: { ...RESTART_BASE, status: 'restart-in-progress' },
          },
        },
      } as any

      const result = getNextRestartStatus(
        state,
        'robotName',
        REACHABLE,
        'shiny-new-boot-id',
        START_TIME
      )

      expect(result).toBe(null)
    })

    it('should return restarting if restart was pending and went down', () => {
      const state: State = {
        robotAdmin: {
          robotName: {
            restart: { ...RESTART_BASE, status: 'restart-pending' },
          },
        },
      } as any

      const result = getNextRestartStatus(
        state,
        'robotName',
        REACHABLE,
        null,
        START_TIME
      )

      expect(result).toBe('restart-in-progress')
    })
  })
})
