/* eslint-disable opentrons/no-direct-mutating */
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { differenceInSeconds, parseISO } from 'date-fns'

import { getSystemTime, putSystemTime } from '@opentrons/api-client'

import { useRobot } from '/app/redux-resources/robots'
import { OPENTRONS_USB } from '/app/redux/discovery'
import { useAccessTokenForRobot } from '/app/redux/robot-auth/hooks'
import { appShellUSBRequestor } from '/app/redux/shell/remote'

import type { HostConfig } from '@opentrons/api-client'

const SYNC_THRESHOLD_SEC = 60

async function syncRobotSystemTime(
  host: HostConfig,
  userNotes: string
): Promise<void> {
  try {
    const { data } = await getSystemTime(host)
    const systemTime = parseISO(data.data.systemTime)
    const drift = differenceInSeconds(systemTime, new Date())
    if (Math.abs(drift) <= SYNC_THRESHOLD_SEC) {
      return
    }
    await putSystemTime(host, new Date().toISOString(), userNotes)
  } catch {
    // Background sync: ignore 403, NTP already synced, etc.
  }
}

/**
 * Syncs robot system time once when the robot becomes available.
 */
export function useSyncRobotClock(robotName: string | null): void {
  const { t } = useTranslation('audit_log')
  const robot = useRobot(robotName)
  const token = useAccessTokenForRobot(robotName)
  const userNotes = t('sync_system_time') as string

  const host = useMemo<HostConfig | null>(() => {
    if (robotName == null || robot?.ip == null) {
      return null
    }
    return {
      hostname: robot.ip,
      port: robot.port,
      requestor: robot.ip === OPENTRONS_USB ? appShellUSBRequestor : undefined,
      token,
      robotName,
    }
  }, [robot?.ip, robot?.port, robotName, token])

  useEffect(() => {
    if (host == null) {
      return
    }
    void syncRobotSystemTime(host, userNotes)
  }, [host, userNotes])
}
