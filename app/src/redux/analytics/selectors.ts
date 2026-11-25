import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { getRobotApiVersion, getViewableRobots } from '../discovery'
import {
  getRobotSystemType,
  getRobotUpdateRobot,
  getRobotUpdateSession,
  getRobotUpdateVersion,
} from '../robot-update'

import type { RobotType } from '@opentrons/shared-data'
import type { State } from '../types'
import type { AnalyticsConfig, BuildrootAnalyticsData } from './types'

export function getBuildrootAnalyticsData(
  state: State,
  robotName: string | null = null
): BuildrootAnalyticsData | null {
  const updateVersion =
    robotName != null ? getRobotUpdateVersion(state, robotName) : null
  const session = getRobotUpdateSession(state)
  const robot =
    robotName === null
      ? getRobotUpdateRobot(state)
      : (getViewableRobots(state).find(r => r.name === robotName) ?? null)

  if (robot === null) return null

  const robotSerialNumber =
    robot?.health?.robot_serial ?? robot?.serverHealth?.serialNumber ?? null

  const currentVersion = getRobotApiVersion(robot) ?? 'unknown'
  const currentSystem = getRobotSystemType(robot) ?? 'unknown'

  const getRobotType = (): RobotType | undefined => {
    switch (currentSystem) {
      case 'flex':
        return FLEX_ROBOT_TYPE
      case 'ot2-buildroot':
      case 'ot2-balena':
        return OT2_ROBOT_TYPE
      case 'unknown':
        return undefined
      default: {
        console.error('Unexpected system type: ', currentSystem)
        return undefined
      }
    }
  }

  return {
    currentVersion,
    currentSystem,
    updateVersion: updateVersion ?? 'unknown',
    error: session != null && 'error' in session ? session.error : null,
    robotSerialNumber,
    robotType: getRobotType(),
  }
}

export function getAnalyticsConfig(state: State): AnalyticsConfig | null {
  return state.config?.analytics ?? null
}

export function getAnalyticsOptedIn(state: State): boolean {
  return state.config?.analytics.optedIn ?? true
}
