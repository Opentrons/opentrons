// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck -- Get around private method access warnings.

import path from 'path'
import fs from 'fs-extra'
import tempy from 'tempy'
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { UI_INITIALIZED } from '../../constants'
import { PARENT_PROCESSES, ResourceMonitor } from '../ResourceMonitor'

const { execMock, fakeLogger } = vi.hoisted(() => ({
  execMock: vi.fn(),
  fakeLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

type ChildProcessModulePartialForMock = Record<string, unknown> & {
  default?: Record<string, unknown>
}

function assertChildProcessModulePartialForMock(
  value: unknown
): asserts value is ChildProcessModulePartialForMock {
  if (typeof value !== 'object' || value === null) {
    throw new Error('importOriginal(child_process) expected an object')
  }
}

vi.mock('child_process', async importOriginal => {
  const actual = await importOriginal()
  assertChildProcessModulePartialForMock(actual)
  const previousDefault: Record<string, unknown> = actual.default ?? {}
  return {
    ...actual,
    exec: execMock,
    default: {
      ...previousDefault,
      exec: execMock,
    },
  }
})
vi.mock('../../log', () => {
  return {
    createLogger: () => fakeLogger,
  }
})

describe('ResourceMonitor', () => {
  let procDir: string
  let monitor: ResourceMonitor
  const tempDirs: string[] = []

  beforeEach(async () => {
    procDir = tempy.directory()
    tempDirs.push(procDir)

    execMock.mockImplementation((cmd, callback) => {
      if (cmd.startsWith('systemctl')) {
        callback(null, 'MainPID=1234\n')
      } else if (cmd.startsWith('pgrep')) {
        callback({ code: 1 } as any, '')
      }
      return {} as any
    })

    // Populate mock files with some mock data.
    await fs.writeFile(path.join(procDir, 'uptime'), '3600.00 7200.00\n')
    await fs.writeFile(
      path.join(procDir, 'meminfo'),
      'MemTotal:        8192000 kB\nMemAvailable:    4096000 kB\n'
    )

    const parentPidDir = path.join(procDir, '1234')
    await fs.ensureDir(parentPidDir)
    await fs.writeFile(
      path.join(parentPidDir, 'cmdline'),
      'process1234\0arg1\0arg2'
    )
    await fs.writeFile(
      path.join(parentPidDir, 'status'),
      'Name:\tprocess\nVmRSS:\t2048 kB\n'
    )

    monitor = new ResourceMonitor({ procPath: procDir })
  })

  afterEach(() => {
    monitor.stop()
  })

  afterAll(() => {
    vi.resetAllMocks()
    return Promise.all(tempDirs.map(d => fs.remove(d)))
  })

  describe('getSystemUptimeHrs', () => {
    it('reads and parses system uptime', () => {
      return monitor.getResourceDetails().then(details => {
        expect(details.systemUptimeHrs).toBe('1.00')
      })
    })

    it('handles error reading uptime file', async () => {
      await fs.remove(path.join(procDir, 'uptime'))
      await expect(monitor.getResourceDetails()).rejects.toThrow(
        'Failed to read system uptime'
      )
    })
  })

  describe('getSystemAvailableMemory', () => {
    it('reads and parses available memory', () => {
      return monitor.getResourceDetails().then(details => {
        expect(details.systemAvailMemMb).toBe('4000.00')
      })
    })

    it('handles missing MemAvailable in meminfo', async () => {
      await fs.writeFile(
        path.join(procDir, 'meminfo'),
        'MemTotal:        8192000 kB\n'
      )

      await expect(monitor.getResourceDetails()).rejects.toThrow(
        'Could not find MemAvailable in meminfo file'
      )
    })
  })

  describe('getProcessDetails', () => {
    it('collects process details for parent process', () => {
      return monitor.getResourceDetails().then(details => {
        expect(details.processesDetails).toHaveLength(PARENT_PROCESSES.length)
        expect(details.processesDetails[0]).toEqual({
          name: 'process1234 arg1 arg2',
          memRssMb: '2.00',
        })
      })
    })

    it('handles missing process', () => {
      // Mock exec to return non-existent PID
      execMock.mockImplementation((cmd, callback) => {
        if (cmd.startsWith('systemctl')) {
          callback(null, 'MainPID=9999\n')
        } else {
          callback({ code: 1 } as any, '')
        }
        return {} as any
      })

      return monitor.getResourceDetails().then(details => {
        expect(details.processesDetails).toHaveLength(0)
      })
    })

    it('handles errors reading process details', async () => {
      await fs.remove(path.join(procDir, '1234', 'status'))
      await monitor.getResourceDetails().then(details => {
        expect(details.processesDetails).toHaveLength(0)
      })
    })
  })

  describe('start', () => {
    it(`handler correctly updates internal state when ${UI_INITIALIZED} is dispatched`, () => {
      const dispatch = vi.fn()
      const handler = monitor.start(dispatch)

      expect(typeof handler).toBe('function')

      handler({ type: UI_INITIALIZED })

      expect(monitor.intervalId).not.toBeNull()
    })
  })
})
