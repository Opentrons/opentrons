import { vi, describe, expect, it } from 'vitest'

import {
  getHealthyRobotDataForNotifyConnections,
  cleanUpUnreachableRobots,
  establishConnections,
  closeConnectionsForcefullyFor,
} from '../connect'
import { connectionStore } from '../store'
import { FAILURE_STATUSES } from '../../constants'
import {
  MOCK_DISCOVERY_ROBOTS,
  MOCK_HEALTHY_ROBOTS,
  MOCK_STORE_ROBOTS,
} from '../../__fixtures__'

vi.mock('electron-store')
vi.mock('../notifyLog', () => {
  return {
    createLogger: () => {
      return { debug: () => null }
    },
    notifyLog: { debug: vi.fn(), warn: vi.fn() },
  }
})

describe('getHealthyRobotDataForNotifyConnections', () => {
  it('should filter a list of discovery robots, only returning robots that have a health status of ok', () => {
    const healthyRobots = getHealthyRobotDataForNotifyConnections(
      MOCK_DISCOVERY_ROBOTS
    )
    expect(healthyRobots).toEqual(MOCK_HEALTHY_ROBOTS)
  })
})

describe('cleanUpUnreachableRobots', () => {
  it('should close connections forcefully for unreachable robots and resolve them', async () => {
    MOCK_STORE_ROBOTS.forEach(robot => {
      void connectionStore
        .setPendingConnection(robot.robotName)
        .then(() =>
          connectionStore.setConnected(robot.robotName, vi.fn() as any)
        )
    })
    const unreachableRobots = await cleanUpUnreachableRobots(
      MOCK_HEALTHY_ROBOTS
    )
    expect(unreachableRobots).toEqual(['opentrons-dev3'])
  })
})

describe('establishConnections', () => {
  it('should not resolve any new connections if all reported robots are already in the connection store and connected', async () => {
    connectionStore.clearStore()
    MOCK_STORE_ROBOTS.forEach(robot => {
      void connectionStore
        .setPendingConnection(robot.robotName)
        .then(() =>
          connectionStore.setConnected(robot.robotName, vi.fn() as any)
        )
    })

    const newRobots = await establishConnections(MOCK_HEALTHY_ROBOTS)
    expect(newRobots).toEqual([])
  })

  it('should not attempt to connect to a robot if it a known notification port blocked robot', async () => {
    await connectionStore.setErrorStatus(
      '10.14.19.51',
      FAILURE_STATUSES.ECONNREFUSED
    )
    connectionStore.clearStore()

    const newRobots = await establishConnections(MOCK_HEALTHY_ROBOTS)
    expect(newRobots).toEqual([
      { ip: '10.14.19.50', robotName: 'opentrons-dev' },
      { ip: '10.14.19.53', robotName: 'opentrons-dev4' },
    ])
  })

  it('should not report a robot as new if it is connecting', async () => {
    connectionStore.clearStore()
    MOCK_STORE_ROBOTS.forEach(robot => {
      void connectionStore.setPendingConnection(robot.robotName)
    })

    const newRobots = await establishConnections(MOCK_HEALTHY_ROBOTS)
    expect(newRobots).toEqual([])
  })

  it('should create a new entry in the connection store for a new robot', async () => {
    connectionStore.clearStore()
    await establishConnections(MOCK_HEALTHY_ROBOTS)
    console.log(connectionStore)
    expect(connectionStore.getRobotNameByIP('10.14.19.50')).not.toBeNull()
  })
})

describe('closeConnectionsForcefullyFor', () => {
  it('should return an array of promises for each closing connection and resolve after closing connections', async () => {
    connectionStore.clearStore()
    MOCK_STORE_ROBOTS.forEach(robot => {
      void connectionStore
        .setPendingConnection(robot.robotName)
        .then(() =>
          connectionStore.setConnected(robot.robotName, vi.fn() as any)
        )
    })
    const closingRobots = closeConnectionsForcefullyFor([
      'opentrons-dev',
      'opentrons-dev2',
    ])
    closingRobots.forEach(robot => expect(robot).toBeInstanceOf(Promise))
  })
})
