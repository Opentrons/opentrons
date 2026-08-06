import {
  useAccessControlEnabledQuery,
  useHealth,
} from '@opentrons/react-api-client'

// subject to change
const MAX_STORAGE_PERCENTAGE = 90

export function useIsRobotOutOfStorage(): boolean {
  const health = useHealth()
  const { data } = useAccessControlEnabledQuery()
  if (data?.data.accessControlEnabled !== true) {
    return false
  }

  const totalMb = health?.disk_details?.systemTotalMb
  const availableMb = health?.disk_details?.systemAvailableMb
  if (totalMb == null || availableMb == null) {
    return false
  }
  const percentUsed = ((totalMb - availableMb) / totalMb) * 100
  return percentUsed >= MAX_STORAGE_PERCENTAGE
}
