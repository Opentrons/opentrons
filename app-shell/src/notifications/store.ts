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

  private readonly knownPortBlockedIPs = new Set<string>()

  public getBrowserWindow(): BrowserWindow | null {
    return this.browserWindow
  }

  public getClient(ip: string): mqtt.MqttClient | null {
    if (ip in this.hosts) {
      return this.hosts[ip].client
    } else {
      return null
    }
  }

  /**
   *
   * @returns {FailedConnStatus} "ECONNREFUSED" is a proxy for a port block error and is only returned once
   * for analytics reasons. Afterward, a generic "ECONNFAILED" is returned.
   */
  public getFailedConnectionStatus(ip: string): FailedConnStatus | null {
    if (ip in this.hosts) {
      const failureStatus = this.hosts[ip].unreachableStatus
      if (failureStatus === FAILURE_STATUSES.ECONNREFUSED) {
        this.hosts[ip].unreachableStatus = FAILURE_STATUSES.ECONNFAILED
      }
      return failureStatus
    } else {
      return null
    }
  }

  public getReachableHosts(): string[] {
    return Object.keys(this.hosts)
  }

  public getAssociatedIPsFromRobotName(robotName: string): string[] {
    return Object.keys(this.hosts).filter(
      ip => this.hosts[ip].robotName === robotName
    )
  }

  public getRobotNameFromIP(ip: string): string | null {
    if (ip in this.hosts) {
      return this.hosts[ip].robotName
    } else return null
  }

  public setBrowserWindow(window: BrowserWindow): void {
    this.browserWindow = window
  }

  public setPendingConnection(ip: string, robotName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isAssociatedBrokerConnecting(robotName)) {
        this.hosts[ip] = {
          robotName,
          client: null,
          subscriptions: new Set(),
          pendingSubs: new Set(),
          pendingUnsubs: new Set(),
          unreachableStatus: null,
        }
        resolve()
      } else {
        reject(
          new Error(
            'Cannot create a new connection while connecting on an associated IP.'
          )
        )
      }
    })
  }

  public setConnected(ip: string, client: mqtt.MqttClient): Promise<void> {
    return new Promise((resolve, reject) => {
      if (ip in this.hosts) {
        if (this.hosts[ip].client == null) {
          this.hosts[ip].client = client
          resolve()
        } else {
          reject(new Error(`Connection already exists for ${ip}`))
        }
      } else {
        reject(new Error('IP is not associated with a connection'))
      }
    })
  }

  /**
   *
   * @description Marks the host as unreachable with an error status derived from the MQTT returned error object.
   *
   */
  public setFailedConnection(ip: string, error: Error): Promise<void> {
    return new Promise((resolve, reject) => {
      if (ip in this.hosts) {
        const errorStatus = error.message.includes(
          FAILURE_STATUSES.ECONNREFUSED
        )
          ? FAILURE_STATUSES.ECONNREFUSED
          : FAILURE_STATUSES.ECONNFAILED

        this.hosts[ip].unreachableStatus = errorStatus
        if (errorStatus === FAILURE_STATUSES.ECONNREFUSED) {
          this.knownPortBlockedIPs.add(ip)
        }
        resolve()
      } else {
        reject(new Error('IP is not associated with a connection'))
      }
    })
  }

  public setSubStatus(
    ip: string,
    topic: NotifyTopic,
    status: 'pending' | 'subscribed'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (ip in this.hosts) {
        const { pendingSubs, subscriptions } = this.hosts[ip]
        if (status === 'pending') {
          pendingSubs.add(topic)
        } else {
          subscriptions.add(topic)
          pendingSubs.delete(topic)
        }
        resolve()
      } else {
        reject(new Error('IP is not associated with a connection'))
      }
    })
  }

  public setUnubStatus(
    ip: string,
    topic: NotifyTopic,
    status: 'pending' | 'unsubscribed'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (ip in this.hosts) {
        const { pendingUnsubs, subscriptions } = this.hosts[ip]
        if (subscriptions.has(topic)) {
          if (status === 'pending') {
            pendingUnsubs.add(topic)
          } else {
            pendingUnsubs.delete(topic)
            subscriptions.delete(topic)
          }
        }
        resolve()
      } else {
        reject(new Error('IP is not associated with a connection'))
      }
    })
  }

  /**
   *
   * @description Creates a new hosts entry for a given IP with HostData that is a reference to an existing
   * IP's HostData. This occurs when two IPs reported by discovery-client actually reference the same broker.
   */
  public associateIPWithExistingHostData(
    ip: string,
    robotName: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const associatedHost = Object.values(this.hosts).find(
        hostData => hostData.robotName === robotName
      )
      if (associatedHost != null) {
        this.hosts[ip] = associatedHost
        resolve()
      } else {
        reject(new Error('No associated IP found.'))
      }
    })
  }

  public deleteAllAssociatedIPsGivenRobotName(
    robotName: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const associatedHosts = this.getAssociatedIPsFromRobotName(robotName)
      associatedHosts.forEach(hostname => {
        delete this.hosts[hostname]
      })
      resolve()
    })
  }

  public isIPInStore(ip: string): boolean {
    return ip in this.hosts
  }

  public isAssociatedWithExistingHostData(robotName: string): boolean {
    return this.getAssociatedIPsFromRobotName(robotName).length > 0
  }

  public isAssociatedBrokerErrored(robotName: string): boolean {
    const associatedRobots = this.getAssociatedIPsFromRobotName(robotName)
    return this.isBrokerErrored(head(associatedRobots) as string)
  }

  public isAssociatedBrokerConnected(robotName: string): boolean {
    const associatedIPs = this.getAssociatedIPsFromRobotName(robotName)
    return this.isConnectedToBroker(head(associatedIPs) as string)
  }

  public isAssociatedBrokerConnecting(robotName: string): boolean {
    const associatedIPs = this.getAssociatedIPsFromRobotName(robotName)
    return this.isConnectingToBroker(head(associatedIPs) as string)
  }

  public isConnectedToBroker(ip: string): boolean {
    return this.hosts[ip]?.client?.connected ?? false
  }

  public isConnectingToBroker(ip: string): boolean {
    return (
      (this.hosts[ip]?.client == null ?? false) && !this.isBrokerErrored(ip)
    )
  }

  public isPendingSub(ip: string, topic: NotifyTopic): boolean {
    if (ip in this.hosts) {
      const { pendingSubs } = this.hosts[ip]
      return pendingSubs.has(topic)
    } else {
      return false
    }
  }

  public isActiveSub(ip: string, topic: NotifyTopic): boolean {
    if (ip in this.hosts) {
      const { subscriptions } = this.hosts[ip]
      return subscriptions.has(topic)
    } else {
      return false
    }
  }

  public isPendingUnsub(ip: string, topic: NotifyTopic): boolean {
    if (ip in this.hosts) {
      const { pendingUnsubs } = this.hosts[ip]
      return pendingUnsubs.has(topic)
    } else {
      return false
    }
  }

  /**
   *
   * @description Reachable refers to whether the broker connection has returned an error.
   */
  public isBrokerErrored(ip: string): boolean {
    if (ip in this.hosts) {
      return this.hosts[ip].unreachableStatus != null
    } else {
      return true
    }
  }

  public isKnownPortBlockedIP(ip: string): boolean {
    return this.knownPortBlockedIPs.has(ip)
  }
}

export const connectionStore = new ConnectionStore()
