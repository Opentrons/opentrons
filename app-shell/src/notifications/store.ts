import type mqtt from 'mqtt'

import { FAILURE_STATUSES } from '../constants'

import type { NotifyTopic } from '@opentrons/app/src/redux/shell/types'
import type { BrowserWindow } from 'electron'

type FailedConnStatus = typeof FAILURE_STATUSES[keyof typeof FAILURE_STATUSES]

interface HostData {
  client: mqtt.MqttClient | null
  subscriptions: Set<NotifyTopic>
  pendingSubs: Set<NotifyTopic>
  pendingUnsubs: Set<NotifyTopic>
  unreachableStatus: FailedConnStatus | null
}

/**
 * @description Manages the internal state of MQTT connections to various robot hosts.
 */
class ConnectionStore {
  private hostsByRobotName: Record<string, HostData> = {}

  private robotNamesByIP: Record<string, string> = {}

  private browserWindow: BrowserWindow | null = null

  private readonly knownPortBlockedIPs = new Set<string>()

  public getBrowserWindow(): BrowserWindow | null {
    return this.browserWindow
  }

  public getAllBrokersInStore(): string[] {
    return Object.keys(this.hostsByRobotName)
  }

  public getClient(ip: string): mqtt.MqttClient | null {
    const hostData = this.getHostDataByIP(ip)
    if (hostData != null) {
      return hostData.client
    } else {
      return null
    }
  }

  /**
   * @returns {FailedConnStatus} "ECONNREFUSED" is a proxy for a port block error and is only returned once
   * for analytics reasons. Afterward, a generic "ECONNFAILED" is returned.
   */
  public getFailedConnectionStatus(ip: string): FailedConnStatus | null {
    const robotName = this.getRobotNameByIP(ip)
    if (robotName != null) {
      const failureStatus = this.hostsByRobotName[robotName].unreachableStatus
      if (failureStatus === FAILURE_STATUSES.ECONNREFUSED) {
        this.hostsByRobotName[robotName].unreachableStatus =
          FAILURE_STATUSES.ECONNFAILED
      }
      return failureStatus
    } else {
      return null
    }
  }

  public getRobotNameByIP(ip: string): string | null {
    return this.robotNamesByIP[ip] ?? null
  }

  public setBrowserWindow(window: BrowserWindow): void {
    this.browserWindow = window
  }

  public setPendingConnection(robotName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnectingToBroker(robotName)) {
        this.hostsByRobotName[robotName] = {
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
            'Cannot create a new connection while currently connecting.'
          )
        )
      }
    })
  }

  public setConnected(
    robotName: string,
    client: mqtt.MqttClient
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (robotName in this.hostsByRobotName) {
        if (this.hostsByRobotName[robotName].client == null) {
          this.hostsByRobotName[robotName].client = client
          resolve()
        } else {
          reject(new Error(`Connection already exists for ${robotName}`))
        }
      } else {
        reject(new Error('IP is not associated with a connection'))
      }
    })
  }

  /**
   * @description Marks the host as unreachable with an error status derived from the MQTT returned error object.
   */
  public setErrorStatus(ip: string, errorMessage: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const robotName = this.getRobotNameByIP(ip)
      if (robotName != null && robotName in this.hostsByRobotName) {
        if (this.hostsByRobotName[robotName].unreachableStatus == null) {
          const errorStatus = errorMessage?.includes(
            FAILURE_STATUSES.ECONNREFUSED
          )
            ? FAILURE_STATUSES.ECONNREFUSED
            : FAILURE_STATUSES.ECONNFAILED

          this.hostsByRobotName[robotName].unreachableStatus = errorStatus
          if (errorStatus === FAILURE_STATUSES.ECONNREFUSED) {
            this.knownPortBlockedIPs.add(ip)
          }
        }
        resolve()
      } else {
        reject(new Error(`${ip} is not associated with a connection`))
      }
    })
  }

  public setSubStatus(
    ip: string,
    topic: NotifyTopic,
    status: 'pending' | 'subscribed'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const robotName = this.getRobotNameByIP(ip)
      if (robotName != null && robotName in this.hostsByRobotName) {
        const { pendingSubs, subscriptions } = this.hostsByRobotName[robotName]
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

  public setUnsubStatus(
    ip: string,
    topic: NotifyTopic,
    status: 'pending' | 'unsubscribed'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const robotName = this.getRobotNameByIP(ip)
      if (robotName != null && robotName in this.hostsByRobotName) {
        const { pendingUnsubs, subscriptions } = this.hostsByRobotName[
          robotName
        ]
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

  public associateIPWithRobotName(ip: string, robotName: string): void {
    const robotNameInStore = this.robotNamesByIP[ip]
    if (robotNameInStore !== robotName) {
      this.robotNamesByIP[ip] = robotName
    }
  }

  /**
   * @description Used for testing purposes.
   */
  public clearStore(): void {
    this.hostsByRobotName = {}
    this.robotNamesByIP = {}
    this.browserWindow = null
  }

  public isConnectedToBroker(robotName: string): boolean {
    return robotName != null
      ? this.hostsByRobotName[robotName]?.client?.connected ?? false
      : false
  }

  public isConnectingToBroker(robotName: string): boolean {
    return (
      (this.hostsByRobotName[robotName]?.client == null ?? false) &&
      !this.isConnectionTerminated(robotName)
    )
  }

  public isPendingSub(robotName: string, topic: NotifyTopic): boolean {
    if (robotName != null && robotName in this.hostsByRobotName) {
      const { pendingSubs } = this.hostsByRobotName[robotName]
      return pendingSubs.has(topic)
    } else {
      return false
    }
  }

  public isActiveSub(robotName: string, topic: NotifyTopic): boolean {
    if (robotName != null && robotName in this.hostsByRobotName) {
      const { subscriptions } = this.hostsByRobotName[robotName]
      return subscriptions.has(topic)
    } else {
      return false
    }
  }

  public isPendingUnsub(ip: string, topic: NotifyTopic): boolean {
    const robotName = this.getRobotNameByIP(ip)
    if (robotName != null && robotName in this.hostsByRobotName) {
      const { pendingUnsubs } = this.hostsByRobotName[robotName]
      return pendingUnsubs.has(topic)
    } else {
      return false
    }
  }

  /**
   * @description A broker connection is terminated if it is errored or not present in the store.
   */
  public isConnectionTerminated(robotName: string): boolean {
    if (robotName in this.hostsByRobotName) {
      return this.hostsByRobotName[robotName].unreachableStatus != null
    } else {
      return true
    }
  }

  public isKnownPortBlockedIP(ip: string): boolean {
    return this.knownPortBlockedIPs.has(ip)
  }

  private getHostDataByIP(ip: string): HostData | null {
    if (ip in this.robotNamesByIP) {
      const robotName = this.robotNamesByIP[ip]
      return this.hostsByRobotName[robotName] ?? null
    } else {
      return null
    }
  }
}

export const connectionStore = new ConnectionStore()
