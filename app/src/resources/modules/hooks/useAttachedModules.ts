import type { AttachedModule, Modules } from '@opentrons/api-client'
import { useModulesQuery } from '@opentrons/react-api-client'
import type { UseQueryOptions } from 'react-query'

export function useAttachedModules(
  options: UseQueryOptions<Modules> = {}
): AttachedModule[] {
  const attachedModulesResponse = useModulesQuery({ ...options })

  return attachedModulesResponse.data?.data || []
}
