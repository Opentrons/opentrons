import { useCallback } from 'react'

import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'

import type { AttachedModule } from '@opentrons/api-client'
import type { IdentifyColor } from '@opentrons/shared-data'

type sendIdentifyModuleType = (
  module: AttachedModule,
  start: boolean,
  color?: IdentifyColor
) => void

export function useSendIdentifyStacker(): sendIdentifyModuleType {
  const { createLiveCommand } = useCreateLiveCommandMutation()

  const sendIdentifyStacker = useCallback(
    (
      module: AttachedModule,
      start: boolean,
      color: IdentifyColor | null = null
    ) => {
      // Only send identify command for flex stacker modules,
      // other module types are not currently supported
      if (module.moduleType === 'flexStackerModuleType') {
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
      } else {
        console.warn(
          `Module type ${module.moduleType} does not support identify command`
        )
      }
    },
    [createLiveCommand]
  )
  return sendIdentifyStacker
}
