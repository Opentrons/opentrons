import { useModulesQuery } from '@opentrons/react-api-client'
import type { UseQueryOptions } from 'react-query'
import type { AttachedModule, Modules } from '@opentrons/api-client'

export function useAttachedModules(
  options: UseQueryOptions<Modules> = {}
): AttachedModule[] {
  const attachedModulesResponse = useModulesQuery({ ...options })

  return attachedModulesResponse.data?.data || []
}
