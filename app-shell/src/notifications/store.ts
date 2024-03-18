/* eslint-disable @typescript-eslint/no-dynamic-delete */
import type mqtt from 'mqtt'
import head from 'lodash/head'

import { FAILURE_STATUSES } from '../constants'

import type { NotifyTopic } from '@opentrons/app/src/redux/shell/types'
import type { BrowserWindow } from 'electron'

type FailedConnStatus = typeof FAILURE_STATUSES[keyof typeof FAILURE_STATUSES]

interface HostData {
  robotName: string
  client: mqtt.MqttClient | null
  subscriptions: Set<NotifyTopic>
  pendingSubs: Set<NotifyTopic>
  pendingUnsubs: Set<NotifyTopic>
  unreachableStatus: FailedConnStatus | null
}

/**
 * Manages the internal state of MQTT connections to various robot hosts.
 */
class ConnectionStore {
  private hosts: Record<string, HostData> = {}

  private browserWindow: BrowserWindow | null = null

  public getBrowserWindow(): BrowserWindow | null {
    return this.browserWindow
  }

  public getClient(hostname: string): mqtt.MqttClient | null {
    if (hostname in this.hosts) {
      return this.hosts[hostname].client
    } else {
      return null
    }
  }

  /**
   *
   * @returns {FailedConnStatus} "ECONNREFUSED" is a proxy for a port block error and is only returned once
   * for analytics reasons. Afterward, a generic "ECONNFAILED" is returned.
   */
  public getFailedConnectionStatus(hostname: string): FailedConnStatus | null {
    if (hostname in this.hosts) {
      const failureStatus = this.hosts[hostname].unreachableStatus
      if (failureStatus === FAILURE_STATUSES.ECONNREFUSED) {
        this.hosts[hostname].unreachableStatus = FAILURE_STATUSES.ECONNFAILED
      }
      return failureStatus
    } else {
      return null
    }
  }

  public getReachableHosts(): string[] {
    return Object.keys(this.hosts)
  }

  public getAssociatedHostnamesFromHostname(hostname: string): string[] {
    const robotName = this.hosts[hostname].robotName
    return Object.keys(this.hosts).filter(
      hostname => this.hosts[hostname].robotName === robotName
    )
  }

  public getAssociatedHostnamesFromRobotName(robotName: string): string[] {
    return Object.keys(this.hosts).filter(
      hostname => this.hosts[hostname].robotName === robotName
    )
  }

  public setBrowserWindow(window: BrowserWindow): void {
    this.browserWindow = window
  }

  public setPendingHost(hostname: string, robotName: string): void {
    if (!this.isAssociatedWithExistingHostData(robotName)) {
      this.hosts[hostname] = {
        robotName,
        client: null,
        subscriptions: new Set(),
        pendingSubs: new Set(),
        pendingUnsubs: new Set(),
        unreachableStatus: null,
      }
    }
  }

  public setConnectedHost(hostname: string, client: mqtt.MqttClient): void {
    if (hostname in this.hosts) {
      if (this.hosts[hostname].client == null) {
        this.hosts[hostname].client = client
      }
    }
  }

  /**
   *
   * @description Adds the host as unreachable with an error status derived from the MQTT returned error object.
   */
  public setFailedToConnectHost(hostname: string, error: Error): void {
    if (hostname in this.hosts) {
      const errorStatus = error.message.includes(FAILURE_STATUSES.ECONNREFUSED)
        ? FAILURE_STATUSES.ECONNREFUSED
        : FAILURE_STATUSES.ECONNFAILED

      this.hosts[hostname].unreachableStatus = errorStatus
    }
  }

  public setSubStatus(
    hostname: string,
    topic: NotifyTopic,
    status: 'pending' | 'subscribed'
  ): void {
    if (hostname in this.hosts) {
      const { pendingSubs, subscriptions } = this.hosts[hostname]
      if (status === 'pending') {
        pendingSubs.add(topic)
      } else {
        subscriptions.add(topic)
        pendingSubs.delete(topic)
      }
    }
  }

  public setUnubStatus(
    hostname: string,
    topic: NotifyTopic,
    status: 'pending' | 'unsubscribed'
  ): void {
    if (hostname in this.hosts) {
      const { pendingUnsubs, subscriptions } = this.hosts[hostname]
      if (subscriptions.has(topic)) {
        if (status === 'pending') {
          pendingUnsubs.add(topic)
        } else {
          pendingUnsubs.delete(topic)
          subscriptions.delete(topic)
        }
      }
    }
  }

  /**
   *
   * @description Creates a new hosts entry for a given hostname with HostData that is a reference to an existing
   * host's HostData. This occurs when two hostnames reported by discovery-client actually point to the same robot.
   */
  public associateWithExistingHostData(
    hostname: string,
    robotName: string
  ): void {
    const associatedHost = Object.values(this.hosts).find(
      hostData => hostData.robotName === robotName
    )
    if (associatedHost != null) {
      this.hosts[hostname] = associatedHost
    }
  }

  // Deleting associated hosts does not prevent the connection from re-establishing on an associated host if an
  // associated host is discoverable.
  public deleteAllAssociatedHostsGivenHostname(hostname: string): void {
    const associatedHosts = this.getAssociatedHostnamesFromHostname(hostname)
    associatedHosts.forEach(hostname => {
      delete this.hosts[hostname]
    })
  }

  public deleteAllAssociatedHostsGivenRobotName(robotName: string): void {
    const associatedHosts = this.getAssociatedHostnamesFromRobotName(robotName)
    associatedHosts.forEach(hostname => {
      delete this.hosts[hostname]
    })
  }

  public isHostnameNewlyDiscovered(hostname: string): boolean {
    return hostname in this.hosts
  }

  public isAssociatedWithExistingHostData(robotName: string): boolean {
    return this.getAssociatedHostnamesFromRobotName(robotName).length != null
  }

  public isAssociatedHostnameReachable(hostname: string): boolean {
    const associatedRobots = this.getAssociatedHostnamesFromHostname(hostname)
    return this.isHostReachable(head(associatedRobots) as string)
  }

  public isAssociatedHostnameConnected(hostname: string): boolean {
    const associatedRobots = this.getAssociatedHostnamesFromHostname(hostname)
    return this.isHostConnected(head(associatedRobots) as string)
  }

  public isHostConnected(hostname: string): boolean {
    if (hostname in this.hosts) {
      return this.hosts[hostname].client != null
    } else {
      return false
    }
  }

  public isPendingSub(hostname: string, topic: NotifyTopic): boolean {
    if (hostname in this.hosts) {
      const { pendingSubs } = this.hosts[hostname]
      return pendingSubs.has(topic)
    } else {
      return false
    }
  }

  public isActiveSub(hostname: string, topic: NotifyTopic): boolean {
    if (hostname in this.hosts) {
      const { subscriptions } = this.hosts[hostname]
      return subscriptions.has(topic)
    } else {
      return false
    }
  }

  public isPendingUnsub(hostname: string, topic: NotifyTopic): boolean {
    if (hostname in this.hosts) {
      const { pendingUnsubs } = this.hosts[hostname]
      return pendingUnsubs.has(topic)
    } else {
      return false
    }
  }

  public isHostReachable(hostname: string): boolean {
    if (hostname in this.hosts) {
      return this.hosts[hostname].unreachableStatus == null
    } else {
      return false
    }
  }
}

export const connectionStore = new ConnectionStore()
