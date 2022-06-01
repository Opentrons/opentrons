import { useModulesQuery } from '@opentrons/react-api-client'
import type { AttachedModule } from '@opentrons/api-client'

export function useAttachedModules(): AttachedModule[] {
  const attachedModulesResponse = useModulesQuery()

  return attachedModulesResponse.data?.data || []
}
