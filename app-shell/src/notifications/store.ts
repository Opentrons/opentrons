/* eslint-disable @typescript-eslint/no-dynamic-delete */
import mqtt from 'mqtt'

import { FAILURE_STATUSES } from '../constants'

import type { NotifyTopic } from '@opentrons/app/src/redux/shell/types'
import type { BrowserWindow } from 'electron'

type FailedConnStatus = typeof FAILURE_STATUSES[keyof typeof FAILURE_STATUSES]

interface IHosts {
  client: mqtt.MqttClient | null
  subscriptions: Set<NotifyTopic>
  pendingSubs: Set<NotifyTopic>
  pendingUnsubs: Set<NotifyTopic>
}

class ConnectionStore {
  private unreachableHosts: Record<string, FailedConnStatus> = {}

  private hosts: Record<string, IHosts> = {}

  private browserWindow: BrowserWindow | null = null

  public getBrowserWindow(): BrowserWindow | null {
    return this.browserWindow
  }

  public setBrowserWindow(window: BrowserWindow): void {
    this.browserWindow = window
  }

  public getHostInfo(hostname: string): IHosts | null {
    if (hostname in this.hosts) {
      return this.hosts[hostname]
    } else {
      return null
    }
  }

  public getIsHostConnected(hostname: string): boolean {
    if (hostname in this.hosts) {
      return this.hosts[hostname].client != null
    } else {
      return false
    }
  }

  public getIsSubscriptionPendingOrActive(
    hostname: string,
    topic: NotifyTopic
  ): boolean {
    if (hostname in this.hosts) {
      const { pendingSubs, subscriptions } = this.hosts[hostname]
      return pendingSubs.has(topic) || subscriptions.has(topic)
    } else {
      return false
    }
  }

  public getIsUnsubscriptionPending(
    hostname: string,
    topic: NotifyTopic
  ): boolean {
    if (hostname in this.hosts) {
      const { pendingUnsubs } = this.hosts[hostname]
      return pendingUnsubs.has(topic)
    } else {
      return false
    }
  }

  public getIsHostReachable(hostname: string): boolean {
    if (hostname in this.unreachableHosts) {
      return false
    } else {
      return hostname in this.hosts
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

  public addPendingHost(hostname: string): void {
    if (!(hostname in this.hosts)) {
      this.hosts[hostname] = {
        client: null,
        subscriptions: new Set(),
        pendingSubs: new Set(),
        pendingUnsubs: new Set(),
      }
    }
  }

  public addConnectedHost(hostname: string, client: mqtt.MqttClient): void {
    if (hostname in this.hosts) {
      if (this.hosts[hostname].client == null) {
        this.hosts[hostname].client = client
      }
    }
  }

  public addFailedToConnectHost(hostname: string, error: Error): void {
    if (!(hostname in this.unreachableHosts)) {
      const errorMessage = error.message.includes(FAILURE_STATUSES.ECONNREFUSED)
        ? FAILURE_STATUSES.ECONNREFUSED
        : FAILURE_STATUSES.ECONNFAILED

      this.unreachableHosts[hostname] = errorMessage
    }
  }

  public removeHost(hostname: string): void {
    if (hostname in this.hosts) {
      delete this.hosts[hostname]
      delete this.unreachableHosts[hostname]
    }
  }

  public updateSubsciptionStatus(
    hostname: string,
    topic: NotifyTopic,
    status: 'pending' | 'subscribed'
  ): void {
    if (hostname in this.hosts) {
      const { pendingSubs, subscriptions } = this.hosts[hostname]
      if (status === 'pending') {
        pendingSubs.add(topic)
      } else {
        pendingSubs.delete(topic)
        subscriptions.add(topic)
      }
    }
  }
}

export const connectionStore = new ConnectionStore()
