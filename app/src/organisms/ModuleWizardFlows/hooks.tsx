import { useCallback } from 'react'

import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'

import type { AttachedModule } from '@opentrons/api-client'
import type { IdentifyColor } from '@opentrons/shared-data'

type sendIdentifyModuleType = (
  module: AttachedModule,
  start: boolean,
  color?: IdentifyColor
) => void

export function useSendIdentifyModule(): sendIdentifyModuleType {
  const { createLiveCommand } = useCreateLiveCommandMutation()

  const sendIdentifyModule = useCallback(
    (
      module: AttachedModule,
      start: boolean,
      color: IdentifyColor | null = null
    ) => {
      createLiveCommand({
        command: {
          commandType: 'identifyModule',
          params: {
            model: module.moduleModel,
            moduleId: module.id,
            start,
            ...(color != null ? { color } : {}),
          },
        },
      }).catch(error => {
        console.log(error.message)
      })
    },
    [createLiveCommand]
  )
  return sendIdentifyModule
}
