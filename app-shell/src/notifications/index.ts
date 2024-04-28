import { connectionStore } from './store'
import {
  establishConnections,
  cleanUpUnreachableRobots,
  getHealthyRobotDataForNotifyConnections,
  closeConnectionsForcefullyFor,
  RobotData,
} from './connect'
import { subscribe } from './subscribe'
import { notifyLog } from './notifyLog'

import type { DiscoveryClientRobot } from '@opentrons/discovery-client'
import type { BrowserWindow } from 'electron'
import type { Action, Dispatch } from '../types'

// Manages MQTT broker connections through a connection store. Broker connections are added  based on health status
// reported by discovery-client and broker connectivity status reported by MQTT. Because a robot may have several IPs,
// only the first reported IP that results in a successful broker connection maintains an active connection.
// All associated IPs reference the active connection. Subscriptions are handled "lazily" - a component must
// dispatch a subscribe action before a subscription request is made to the broker. Unsubscribe requests only occur if
// the broker sends an "unsubscribe" flag. Pending subs and unsubs are used to prevent unnecessary network and broker load.

export function registerNotify(
  dispatch: Dispatch,
  mainWindow: BrowserWindow
): (action: Action) => unknown {
  if (connectionStore.getBrowserWindow() == null) {
    connectionStore.setBrowserWindow(mainWindow)
  }

  return function handleAction(action: Action) {
    switch (action.type) {
      case 'shell:NOTIFY_SUBSCRIBE':
        return subscribe(action.payload.hostname, action.payload.topic)
    }
  }
}

export function handleNotificationConnectionsFor(
  robots: DiscoveryClientRobot[]
): RobotData[] {
  const reachableRobots = getHealthyRobotDataForNotifyConnections(robots)
  void cleanUpUnreachableRobots(reachableRobots)
  void establishConnections(reachableRobots)

  return reachableRobots
}

export function closeAllNotifyConnections(): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(Error('Failed to close all connections within the time limit.'))
    }, 2000)

    notifyLog.debug('Stopping notify service connections')
    const closeConnections = closeConnectionsForcefullyFor(
      connectionStore.getAllBrokersInStore()
    )
    Promise.all(closeConnections).then(resolve).catch(reject)
  })
}
