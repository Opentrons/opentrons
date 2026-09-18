import { useCallback } from 'react'

import { useRobotUpdateContext } from '/app/resources/robot-update/RobotUpdateContext'

import { useRequireAdminForUpdates } from './useRequireAdminForUpdates'

export interface GatedStartRobotUpdateResult {
  isLoading: boolean
  startUpdate: (systemFile?: string) => boolean
}

/**
 * Wraps orchestrator startUpdate with the admin-credentials gate.
 * Prefer this hook over useRobotUpdateContext for any user-driven robot update flow.
 */
export function useGatedStartRobotUpdate(
  robotName: string
): GatedStartRobotUpdateResult {
  const { startUpdate } = useRobotUpdateContext()
  const { ensureCanUpdate, isLoading } = useRequireAdminForUpdates(robotName)

  const gatedStartUpdate = useCallback(
    (systemFile?: string): boolean => {
      if (!ensureCanUpdate()) {
        return false
      }
      startUpdate(robotName, systemFile)
      return true
    },
    [ensureCanUpdate, robotName, startUpdate]
  )

  return { isLoading, startUpdate: gatedStartUpdate }
}
