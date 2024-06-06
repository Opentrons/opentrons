import type mqtt from 'mqtt'

import { FAILURE_STATUSES } from '../constants'

import type { NotifyTopic } from '@opentrons/app/src/redux/shell/types'
import type { BrowserWindow } from 'electron'

type FailedConnStatus = typeof FAILURE_STATUSES[keyof typeof FAILURE_STATUSES]

/**
 * @description Manages the internal state of MQTT connections to various robot hosts.
 */
class ConnectionStore {
  public readonly ip = '127.0.0.1'

  public readonly robotName = 'LOCALHOST'

  public client: mqtt.MqttClient | null = null

  private readonly subscriptions: Set<NotifyTopic> = new Set<NotifyTopic>()

  private readonly pendingSubs: Set<NotifyTopic> = new Set<NotifyTopic>()

  private readonly pendingUnsubs: Set<NotifyTopic> = new Set<NotifyTopic>()

  private unreachableStatus: FailedConnStatus | null = null

  private browserWindow: BrowserWindow | null = null

  public getBrowserWindow(): BrowserWindow | null {
    return this.browserWindow
  }

  /**
   * @returns {FailedConnStatus} "ECONNREFUSED" is a proxy for a port block error and is only returned once
   * for analytics reasons. Afterward, a generic "ECONNFAILED" is returned.
   */
  public getFailedConnectionStatus(): FailedConnStatus | null {
    const failureStatus = this.unreachableStatus
    if (failureStatus === FAILURE_STATUSES.ECONNREFUSED) {
      this.unreachableStatus = FAILURE_STATUSES.ECONNFAILED
    }
    return failureStatus
  }

  public setBrowserWindow(window: BrowserWindow): void {
    this.browserWindow = window
  }

  public setConnected(client: mqtt.MqttClient): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client == null) {
        this.client = client
        resolve()
      } else {
        reject(new Error(`Connection already exists for ${this.robotName}`))
      }
    })
  }

  /**
   * @description Marks the host as unreachable. Don't report ECONNREFUSED, since while this is a good enough proxy
   * for port block events, it's not perfect, and a port block event can never actually occur on the ODD.
   */
  public setErrorStatus(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.unreachableStatus = FAILURE_STATUSES.ECONNFAILED
      resolve()
    })
  }

  public setSubStatus(
    topic: NotifyTopic,
    status: 'pending' | 'subscribed'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (status === 'pending') {
        this.pendingSubs.add(topic)
      } else {
        this.subscriptions.add(topic)
        this.pendingSubs.delete(topic)
      }
      resolve()
    })
  }

  public setUnsubStatus(
    topic: NotifyTopic,
    status: 'pending' | 'unsubscribed'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.subscriptions.has(topic)) {
        if (status === 'pending') {
          this.pendingUnsubs.add(topic)
        } else {
          this.pendingUnsubs.delete(topic)
          this.subscriptions.delete(topic)
        }
      }
      resolve()
    })
  }

  public isConnectedToBroker(): boolean {
    return this.client?.connected ?? false
  }

  public isPendingSub(topic: NotifyTopic): boolean {
    return this.pendingSubs.has(topic)
  }

  public isActiveSub(topic: NotifyTopic): boolean {
    return this.subscriptions.has(topic)
  }

  public isPendingUnsub(topic: NotifyTopic): boolean {
    return this.pendingUnsubs.has(topic)
  }

  /**
   * @description A broker connection is terminated if it is errored or not present in the store.
   */
  public isConnectionTerminated(): boolean {
    return this.unreachableStatus != null
  }
}

export const connectionStore = new ConnectionStore()
