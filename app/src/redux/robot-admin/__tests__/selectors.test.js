// @flow
import { add } from 'date-fns'
import { CONNECTABLE, REACHABLE } from '../../discovery'
import {
  getRobotRestarting,
  getNextRestartStatus,
  getResetConfigOptions,
} from '../selectors'
import type { State } from '../../types'

type PartialState = $Shape<State>

const START_TIME = new Date('2000-01-01')

const RESTART_BASE = {
  bootId: null,
  startTime: START_TIME,
}

describe('robot admin selectors', () => {
  describe('get reset config options', () => {
    it('should return empty array by default', () => {
      const state: PartialState = { robotAdmin: {} }

      const result = getResetConfigOptions(state, 'robotName')

      expect(result).toEqual([])
    })

    it('should return options from state', () => {
      const state: PartialState = {
        robotAdmin: {
          robotName: {
            resetConfigOptions: [
              { id: 'foo', name: 'Foo', description: 'foobar' },
              { id: 'baz', name: 'Baz', description: 'bazqux' },
            ],
          },
        },
      }

      const result = getResetConfigOptions(state, 'robotName')

      expect(result).toEqual([
        { id: 'foo', name: 'Foo', description: 'foobar' },
        { id: 'baz', name: 'Baz', description: 'bazqux' },
      ])
    })
  })

  describe('get robot restarting', () => {
    it('should return true if restart status is pending or in progress', () => {
      const state: PartialState = {
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
      }

      expect(getRobotRestarting(state, 'succeeded')).toBe(false)
      expect(getRobotRestarting(state, 'failed')).toBe(false)
      expect(getRobotRestarting(state, 'pending')).toBe(true)
      expect(getRobotRestarting(state, 'inProgress')).toBe(true)
    })
  })

  describe('get next robot restarting status', () => {
    it('should return null if robot is not restarting', () => {
      const state: PartialState = {
        robotAdmin: {
          succeeded: {
            restart: { ...RESTART_BASE, status: 'restart-succeeded' },
          },
          failed: { restart: { ...RESTART_BASE, status: 'restart-failed' } },
          timedOut: {
            restart: { ...RESTART_BASE, status: 'restart-timed-out' },
          },
        },
      }

      const baseArgs = [CONNECTABLE, 'boot-id', new Date()]

      expect(getNextRestartStatus(state, 'nonExistent', ...baseArgs)).toBe(null)
      expect(getNextRestartStatus(state, 'succeeded', ...baseArgs)).toBe(null)
      expect(getNextRestartStatus(state, 'failed', ...baseArgs)).toBe(null)
      expect(getNextRestartStatus(state, 'timedOut', ...baseArgs)).toBe(null)
    })

    it('should return restart success if connectable robot has new boot ID', () => {
      const state: PartialState = {
        robotAdmin: {
          robotName: {
            restart: { ...RESTART_BASE, status: 'restart-pending' },
          },
        },
      }

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
      const state: PartialState = {
        robotAdmin: {
          robotName: {
            restart: { ...RESTART_BASE, status: 'restart-in-progress' },
          },
        },
      }

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
      const state: PartialState = {
        robotAdmin: {
          robotName: {
            restart: { ...RESTART_BASE, status: 'restart-pending' },
          },
        },
      }

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
      const state: PartialState = {
        robotAdmin: {
          robotName: {
            restart: { ...RESTART_BASE, status: 'restart-in-progress' },
          },
        },
      }

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
      const state: PartialState = {
        robotAdmin: {
          robotName: {
            restart: { ...RESTART_BASE, status: 'restart-pending' },
          },
        },
      }

      const result = getNextRestartStatus(
        state,
        'robotName',
        REACHABLE,
        null,
        START_TIME
      )

      expect(result).toBe('restart-in-progress')
    })

    it('should return restart timed out if it takes too long', () => {
      const startTime = new Date('2000-01-01')
      const notLongEnough = add(startTime, { seconds: 299 })
      const tooLong = add(startTime, { seconds: 301 })

      const state: PartialState = {
        robotAdmin: {
          robotName: {
            restart: {
              ...RESTART_BASE,
              startTime,
              status: 'restart-in-progress',
            },
          },
        },
      }

      const before = getNextRestartStatus(
        state,
        'robotName',
        REACHABLE,
        null,
        notLongEnough
      )

      const after = getNextRestartStatus(
        state,
        'robotName',
        REACHABLE,
        null,
        tooLong
      )

      expect(before).toBe(null)
      expect(after).toBe('restart-timed-out')
    })
  })
})
