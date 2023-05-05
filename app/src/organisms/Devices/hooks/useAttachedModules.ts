import type { AttachedModule } from '@opentrons/api-client'
import { useModulesQuery } from '@opentrons/react-api-client'

export function useAttachedModules(): AttachedModule[] {
  const attachedModulesResponse = useModulesQuery()

  return attachedModulesResponse.data?.data || []
}
