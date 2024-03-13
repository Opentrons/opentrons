import mqtt from 'mqtt'

import type { NotifyTopic } from '@opentrons/app/lib/redux/shell/types'
import type { BrowserWindow } from 'electron'

interface HostnameInfo {
  client: mqtt.MqttClient | null
  subscriptions: Set<NotifyTopic>
  pendingSubs: Set<NotifyTopic>
}
interface ConnectionStore {
  unreachableHosts: Set<string>
  pendingUnsubs: Set<NotifyTopic>
  robotsWithReportedPortBlockEvent: Set<string>
  hostnames: Record<string, HostnameInfo>
  browserWindow: BrowserWindow | null
}

// Correct and make sure everything can work. What are the transitiions I actually need?
// Subscribing. If host IS UNREACHABLE, then return. Otherwise, HANDLE SUBSCRIPTION.
// HANDLE SUB-> If IS CONNECTED, IS SUBSCRIBED (do subscribe pending logic here if not).
// Pretty much same flow for unsubscribe. The key is to implictly move stuff between states.
// Any state transition should be encapsulated.
export const connectionStore: ConnectionStore = {
  unreachableHosts: new Set(),
  pendingUnsubs: new Set(),
  robotsWithReportedPortBlockEvent: new Set(),
  hostnames: {},
  browserWindow: null,
}
