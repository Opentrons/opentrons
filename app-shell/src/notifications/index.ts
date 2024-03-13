import type { Action, Dispatch } from '../types'
import type { BrowserWindow } from 'electron'
import { connectionStore } from '../notify'
import type { DiscoveryClientRobot } from '@opentrons/discovery-client'
import {
  addNewRobotsToConnectionStore,
  cleanUpUnreachableRobots,
  getHealthyRobotIPsForNotifications,
} from './connect'

// Manages MQTT broker connections through a connection store. Broker connections are added or removed based on
// health status changes reported by discovery-client. Subscriptions are handled "lazily", in which a component must
// express interest in a topic before a subscription request is made. Unsubscribe requests only occur if an "unsubscribe"
// flag is received from the broker. Pending subs and unsubs are used to prevent unnecessary network and broker load.

export function registerNotify(
  dispatch: Dispatch,
  mainWindow: BrowserWindow
): (action: Action) => unknown {
  if (connectionStore.browserWindow == null) {
    connectionStore.browserWindow = mainWindow
  }

  return function handleAction(action: Action) {
    switch (action.type) {
      case 'shell:NOTIFY_SUBSCRIBE':
        return subscribe({
          ...action.payload,
        })
    }
  }
}

// Correct and make sure everything can work. What are the transitiions I actually need?
// Subscribing. If host IS UNREACHABLE, then return. Otherwise, HANDLE SUBSCRIPTION.
// HANDLE SUB-> If IS CONNECTED, IS SUBSCRIBED (do subscribe pending logic here if not).
// Pretty much same flow for unsubscribe. The key is to implictly move stuff between states.
// Any state transition should be encapsulated.
export function handleNotificationConnectionsFor(
  robots: DiscoveryClientRobot[]
): string[] {
  const reachableRobotIPs = getHealthyRobotIPsForNotifications(robots)
  cleanUpUnreachableRobots(reachableRobotIPs)
  addNewRobotsToConnectionStore(reachableRobotIPs)

  return reachableRobotIPs
}

export function closeAllNotifyConnections(): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(Error('Failed to close all connections within the time limit.'))
    }, 2000)

    log.debug('Stopping notify service connections')
    const closeConnections = closeConnectionsForcefullyFor(
      Object.keys(connectionStore)
    )
    Promise.all(closeConnections).then(resolve).catch(reject)
  })
}
