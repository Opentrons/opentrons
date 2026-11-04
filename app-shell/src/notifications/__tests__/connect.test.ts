import { describe, expect, it, vi } from 'vitest'

import {
  MOCK_DISCOVERY_ROBOTS,
  MOCK_HEALTHY_ROBOTS,
  MOCK_STORE_ROBOTS,
} from '../../__fixtures__'
import { FAILURE_STATUSES } from '../../constants'
import {
  cleanUpUnreachableRobots,
  closeConnectionsForcefullyFor,
  establishConnections,
  getHealthyRobotDataForNotifyConnections,
} from '../connect'
import { connectionStore } from '../store'

vi.mock('electron-store')
vi.mock('../notifyLog', () => {
  return {
    createLogger: () => {
      return { debug: () => null }
    },
    notifyLog: { debug: vi.fn(), warn: vi.fn() },
  }
})

const seedPendingConnections = async (): Promise<void> => {
  await Promise.all(
    MOCK_STORE_ROBOTS.map(async robot => {
      await connectionStore.associateIPWithRobotName(robot.ip, robot.robotName)
      await connectionStore.setPendingConnection(robot.robotName)
    })
  )
}

const seedConnectedRobots = async (): Promise<void> => {
  await seedPendingConnections()
  await Promise.all(
    MOCK_STORE_ROBOTS.map(robot =>
      connectionStore.setConnected(robot.robotName, vi.fn() as any)
    )
  )
}

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
    connectionStore.clearStore()
    await seedConnectedRobots()
    const unreachableRobots =
      await cleanUpUnreachableRobots(MOCK_HEALTHY_ROBOTS)
    expect(unreachableRobots).toEqual(['opentrons-dev3'])
  })
})

describe('establishConnections', () => {
  it('should not resolve any new connections if all reported robots are already in the connection store and connected', async () => {
    connectionStore.clearStore()
    await seedConnectedRobots()

    const newRobots = await establishConnections(MOCK_HEALTHY_ROBOTS)
    expect(newRobots).toEqual([])
  })

  it('should not attempt to connect to a robot if it a known notification port blocked robot', async () => {
    connectionStore.clearStore()
    connectionStore.associateIPWithRobotName('10.14.19.51', 'opentrons-dev2')
    await connectionStore.setPendingConnection('opentrons-dev2')
    await connectionStore.setErrorStatus(
      '10.14.19.51',
      FAILURE_STATUSES.ECONNREFUSED
    )

    const newRobots = await establishConnections(MOCK_HEALTHY_ROBOTS)
    expect(newRobots).toEqual([
      { ip: '10.14.19.50', robotName: 'opentrons-dev' },
      { ip: '10.14.19.53', robotName: 'opentrons-dev4' },
    ])
  })

  it('should not report a robot as new if it is connecting', async () => {
    connectionStore.clearStore()
    await seedPendingConnections()

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
    await seedConnectedRobots()
    const closingRobots = closeConnectionsForcefullyFor([
      'opentrons-dev',
      'opentrons-dev2',
    ])
    closingRobots.forEach(robot => expect(robot).toBeInstanceOf(Promise))
  })
})
