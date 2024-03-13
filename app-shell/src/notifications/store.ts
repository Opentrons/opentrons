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
export const connectionStore: ConnectionStore = {
  unreachableHosts: new Set(),
  pendingUnsubs: new Set(),
  robotsWithReportedPortBlockEvent: new Set(),
  hostnames: {},
  browserWindow: null,
}
