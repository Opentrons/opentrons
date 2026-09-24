import {
  useAccessControlEnabledQuery,
  useHealth,
} from '@opentrons/react-api-client'

export function useIsRobotOutOfStorage(): boolean {
  const health = useHealth()
  const { data } = useAccessControlEnabledQuery()
  if (data?.data.accessControlEnabled !== true) {
    return false
  }

  return health?.disk_details?.isDiskSpaceBelowRunStartLimit ?? false
}
