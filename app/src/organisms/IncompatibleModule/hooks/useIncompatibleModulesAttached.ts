import { useModulesQuery } from '@opentrons/react-api-client'
import type { UseQueryOptions } from 'react-query'
import type { AttachedModule, Modules, HostConfig } from '@opentrons/api-client'

export function useIncompatibleModulesAttached(
  options: UseQueryOptions<Modules> = {},
  hostOverride?: HostConfig | null
): AttachedModule[] {
  const { data, error } = useModulesQuery({
    ...options,
  })
  return error == null
    ? data?.data.filter(
        attachedModule => attachedModule?.compatibleWithRobot === false
      ) || []
    : []
}
