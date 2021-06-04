import { createSelector } from 'reselect'
import without from 'lodash/without'

import { getConfig } from '../config'

import type { State } from '../types'
import type { Config } from '../config/types'
import type { AlertId, AlertsState } from './types'

const getIgnoredAlertsFromConfig: (
  state: State
) => null | AlertId[] = createSelector(
  getConfig,
  (config: Config | null) => (config?.alerts.ignored as AlertId[]) ?? null
)

export const getActiveAlerts: (state: State) => AlertId[] = createSelector(
  state => state.alerts,
  getIgnoredAlertsFromConfig,
  (alerts: AlertsState, ignoredAlerts: null | AlertId[]): AlertId[] => {
    // only return active alerts if we know which alerts (if any) have been
    // permanently ignored
    return ignoredAlerts !== null
      ? without(alerts.active, ...alerts.ignored, ...ignoredAlerts)
      : []
  }
)

export const getAlertIsPermanentlyIgnored = (
  state: State,
  alertId: AlertId
): boolean | null => {
  const permaIgnoreList = getIgnoredAlertsFromConfig(state)
  return permaIgnoreList ? permaIgnoreList.includes(alertId) : null
}
