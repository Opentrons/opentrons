/* eslint-disable @typescript-eslint/no-dynamic-delete */
import type mqtt from 'mqtt'

import { FAILURE_STATUSES } from '../constants'

import type { NotifyTopic } from '@opentrons/app/src/redux/shell/types'
import type { BrowserWindow } from 'electron'

type FailedConnStatus = typeof FAILURE_STATUSES[keyof typeof FAILURE_STATUSES]

interface IHosts {
  robotName: string
  client: mqtt.MqttClient | null
  subscriptions: Set<NotifyTopic>
  pendingSubs: Set<NotifyTopic>
  pendingUnsubs: Set<NotifyTopic>
}

/**
 * Manages the internal state of MQTT connections to various robot hosts.
 */
class ConnectionStore {
  private hosts: Record<string, IHosts> = {}

  private unreachableHosts: Record<string, FailedConnStatus> = {}

  readonly seenRobotNames = new Set<string>()

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
    if (hostname in this.unreachableHosts) {
      const failureStatus = this.unreachableHosts[hostname]
      if (failureStatus === FAILURE_STATUSES.ECONNREFUSED) {
        this.unreachableHosts[hostname] = FAILURE_STATUSES.ECONNFAILED
      }
      return failureStatus
    } else {
      return null
    }
  }

  public getUnreachableHosts(): string[] {
    return Object.keys(this.unreachableHosts)
  }

  public setBrowserWindow(window: BrowserWindow): void {
    this.browserWindow = window
  }

  public setPendingHost(hostname: string, robotName: string): void {
    if (!this.seenRobotNames.has(robotName)) {
      if (!(hostname in this.hosts)) {
        this.seenRobotNames.add(robotName)
        this.hosts[hostname] = {
          robotName,
          client: null,
          subscriptions: new Set(),
          pendingSubs: new Set(),
          pendingUnsubs: new Set(),
        }
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
      delete this.hosts[hostname]
    }
    if (!(hostname in this.unreachableHosts)) {
      const errorStatus = error.message.includes(FAILURE_STATUSES.ECONNREFUSED)
        ? FAILURE_STATUSES.ECONNREFUSED
        : FAILURE_STATUSES.ECONNFAILED

      this.unreachableHosts[hostname] = errorStatus
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

  public deleteHost(hostname: string): void {
    if (hostname in this.hosts) {
      this.seenRobotNames.delete(this.hosts[hostname].robotName)
      delete this.hosts[hostname]
    }
    if (hostname in this.unreachableHosts) {
      delete this.unreachableHosts[hostname]
    }
  }

  public isHostNewlyDiscovered(hostname: string, name: string): boolean {
    if (this.seenRobotNames.has(name)) {
      return false
    } else if (hostname in this.hosts) {
      return false
    } else if (hostname in this.unreachableHosts) {
      return false
    } else {
      return true
    }
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
    if (hostname in this.unreachableHosts) {
      return false
    } else {
      return hostname in this.hosts
    }
  }
}

export const connectionStore = new ConnectionStore()
